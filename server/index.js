import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import { query } from './db.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const officialHost = /(^|\.)gov\.in$/i;

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',').map(value => value.trim()) : true }));
app.use(express.json({ limit: '32kb' }));

function userId(req) {
    const value = req.get('x-user-id');
    if (!value || !/^[A-Za-z0-9_-]{1,100}$/.test(value)) return null;
    return value;
}

function requireUser(req, res, next) {
    const id = userId(req);
    if (!id) return res.status(401).json({ error: 'A valid authenticated user id is required.' });
    req.userId = id;
    next();
}

function parseOptionalNumber(value, field) {
    if (value === undefined || value === null || value === '') return null;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) throw new Error(`${field} must be a non-negative number`);
    return number;
}

function validateProfile(body) {
    const name = String(body.name || '').trim();
    const mobile = String(body.mobile || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    if (!name || name.length > 200) throw new Error('name is required and must be 200 characters or fewer');
    if (!/^[6-9][0-9]{9}$/.test(mobile)) throw new Error('mobile must be a valid Indian mobile number');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('email must be valid');
    return {
        name, mobile, email,
        state: body.state ? String(body.state).trim().slice(0, 100) : null,
        district: body.district ? String(body.district).trim().slice(0, 100) : null,
        dateOfBirth: body.dateOfBirth || null,
        income: parseOptionalNumber(body.income, 'income'),
        education: body.education ? String(body.education).trim().slice(0, 200) : null,
        occupation: body.occupation ? String(body.occupation).trim().slice(0, 200) : null,
    };
}

function officialUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && officialHost.test(url.hostname);
    } catch {
        return false;
    }
}

function schemeSelect() {
    return `
        SELECT s.*, COALESCE(jsonb_agg(jsonb_build_object('name', sd.document_type, 'required', sd.required) ORDER BY sd.document_type) FILTER (WHERE sd.document_type IS NOT NULL), '[]'::jsonb) AS documents,
               COALESCE(ser.rules, '{}'::jsonb) AS rules
        FROM schemes s
        LEFT JOIN scheme_documents sd ON sd.scheme_id = s.id
        LEFT JOIN scheme_eligibility_rules ser ON ser.scheme_id = s.id
    `;
}

function serializeScheme(row, includeRules = false) {
    const result = {
        id: row.id,
        name: row.name,
        shortDescription: row.short_description,
        description: row.description,
        benefits: row.benefits,
        scope: row.scope,
        state: row.state,
        eligibilityHighlight: row.eligibility_highlight,
        eligibilityDetails: row.eligibility_details,
        whoCanApply: row.who_can_apply,
        ageMin: row.age_min,
        ageMax: row.age_max,
        incomeMax: row.income_max,
        educationRequirements: row.education_requirements,
        locationRequirements: row.location_requirements,
        applicationProcedure: row.application_procedure,
        deadline: row.deadline,
        officialApplicationUrl: row.official_application_url,
        officialSourceUrl: row.official_source_url,
        lastUpdated: row.last_updated,
        documents: row.documents,
    };
    if (includeRules) result.rules = row.rules;
    return result;
}

function normalizedDocuments(documents) {
    return new Set(documents.map(document => document.document_type.toLowerCase()));
}

function assessScheme(row, profile, documents) {
    const rules = row.rules || {};
    const known = [];
    const blockers = [];
    const available = normalizedDocuments(documents);
    const requiredDocuments = Array.isArray(rules.requiredDocuments) ? rules.requiredDocuments : [];
    const missingDocuments = requiredDocuments.filter(document => !available.has(String(document).toLowerCase()));
    if (requiredDocuments.length) {
        known.push('required documents');
        if (missingDocuments.length) blockers.push(`Missing: ${missingDocuments.join(', ')}`);
    }
    if (Array.isArray(rules.states) && rules.states.length) {
        known.push('state');
        if (!profile.state || !rules.states.map(String).map(value => value.toLowerCase()).includes(profile.state.toLowerCase())) blockers.push('State requirement not confirmed');
    }
    if (row.income_max !== null) {
        known.push('income');
        if (profile.income === null || Number(profile.income) > Number(row.income_max)) blockers.push('Income requirement not met or unavailable');
    }
    if (row.age_min !== null || row.age_max !== null) {
        known.push('age');
        if (!profile.date_of_birth) blockers.push('Age requirement cannot be determined');
        else {
            const birth = new Date(profile.date_of_birth);
            const age = Math.floor((Date.now() - birth.getTime()) / 31557600000);
            if (row.age_min !== null && age < row.age_min) blockers.push('Age requirement not met');
            if (row.age_max !== null && age > row.age_max) blockers.push('Age requirement not met');
        }
    }
    const status = blockers.length ? 'May Be Eligible' : (known.length ? 'May Be Eligible' : 'May Be Eligible');
    return { status, reasons: blockers, missingDocuments };
}

app.get('/api/health', async (_req, res) => {
    try {
        await query('SELECT 1');
        res.json({ ok: true, database: 'connected' });
    } catch {
        res.status(503).json({ ok: false, database: 'unavailable' });
    }
});

app.get('/api/schemes', async (req, res, next) => {
    try {
        const values = [];
        const filters = [];
        if (req.query.scope === 'central' || req.query.scope === 'state') { values.push(req.query.scope); filters.push(`s.scope = $${values.length}`); }
        if (req.query.state) { values.push(String(req.query.state)); filters.push(`s.state = $${values.length}`); }
        const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : '';
        const result = await query(`${schemeSelect()}${where} GROUP BY s.id, ser.rules ORDER BY s.name`, values);
        res.json({ schemes: result.rows.map(row => serializeScheme(row)) });
    } catch (error) { next(error); }
});

app.get('/api/schemes/:id', async (req, res, next) => {
    try {
        const result = await query(`${schemeSelect()} WHERE s.id = $1 GROUP BY s.id, ser.rules`, [req.params.id]);
        if (!result.rowCount) return res.status(404).json({ error: 'Scheme not found.' });
        res.json({ scheme: serializeScheme(result.rows[0]) });
    } catch (error) { next(error); }
});

app.get('/api/schemes/:id/documents', async (req, res, next) => {
    try {
        const result = await query('SELECT document_type AS name, required FROM scheme_documents WHERE scheme_id = $1 ORDER BY document_type', [req.params.id]);
        res.json({ documents: result.rows });
    } catch (error) { next(error); }
});

app.get('/api/recommendations', requireUser, async (req, res, next) => {
    try {
        const profileResult = await query('SELECT * FROM users WHERE id = $1', [req.userId]);
        if (!profileResult.rowCount) return res.status(404).json({ error: 'User profile not found.' });
        const documentsResult = await query('SELECT document_type, verification_status FROM documents WHERE user_id = $1', [req.userId]);
        const schemesResult = await query(`${schemeSelect()} GROUP BY s.id, ser.rules ORDER BY s.name`, []);
        const profile = profileResult.rows[0];
        const recommendations = schemesResult.rows.map(row => ({ scheme: serializeScheme(row), assessment: assessScheme(row, profile, documentsResult.rows) }));
        res.json({ recommendations });
    } catch (error) { next(error); }
});

app.put('/api/profile', requireUser, async (req, res, next) => {
    try {
        const profile = validateProfile(req.body || {});
        await query(`INSERT INTO users (id, name, mobile, email, state, district, date_of_birth, income, education, occupation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, mobile=EXCLUDED.mobile, email=EXCLUDED.email, state=EXCLUDED.state, district=EXCLUDED.district, date_of_birth=EXCLUDED.date_of_birth, income=EXCLUDED.income, education=EXCLUDED.education, occupation=EXCLUDED.occupation, updated_at=NOW()`, [req.userId, profile.name, profile.mobile, profile.email, profile.state, profile.district, profile.dateOfBirth, profile.income, profile.education, profile.occupation]);
        res.status(204).end();
    } catch (error) {
        if (error.message.includes('must be') || error.message.includes('is required')) return res.status(400).json({ error: error.message });
        next(error);
    }
});

app.post('/api/documents', requireUser, async (req, res, next) => {
    try {
        const id = String(req.body.id || '').trim();
        const documentType = String(req.body.documentType || '').trim();
        if (!/^[A-Za-z0-9_-]{1,100}$/.test(id) || !documentType || documentType.length > 120) return res.status(400).json({ error: 'id and documentType are required.' });
        await query('INSERT INTO documents (id, user_id, document_type, verification_status) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO UPDATE SET document_type=EXCLUDED.document_type', [id, req.userId, documentType, 'unverified']);
        res.status(201).json({ id, documentType, verificationStatus: 'unverified' });
    } catch (error) { next(error); }
});

app.delete('/api/documents/:id', requireUser, async (req, res, next) => {
    try {
        await query('DELETE FROM documents WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        res.status(204).end();
    } catch (error) { next(error); }
});

app.get('/css/:file', (req, res) => res.sendFile(path.join(root, 'css', req.params.file)));
app.get('/js/:file', (req, res) => res.sendFile(path.join(root, 'js', req.params.file)));
app.get('/', (_req, res) => res.sendFile(path.join(root, 'index.html')));

app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'The service could not complete the request.' });
});

app.listen(port, () => console.log(`Sugam Seva server listening on http://localhost:${port}`));
