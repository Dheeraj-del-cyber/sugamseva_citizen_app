import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from './db.js';

function required(value, field) {
    if (value === undefined || value === null || value === '') throw new Error(`Missing ${field}`);
    return value;
}

function officialUrl(value, field) {
    const url = new URL(required(value, field));
    if (url.protocol !== 'https:' || !/(^|\.)gov\.in$/i.test(url.hostname)) {
        throw new Error(`${field} must be an HTTPS government URL`);
    }
    return url.toString();
}

function normalizeScheme(scheme) {
    const normalized = {
        id: String(required(scheme.id, 'id')),
        name: String(required(scheme.name, 'name')),
        shortDescription: String(required(scheme.shortDescription, 'shortDescription')),
        description: String(required(scheme.description, 'description')),
        benefits: String(required(scheme.benefits, 'benefits')),
        scope: required(scheme.scope, 'scope'),
        state: scheme.state || null,
        eligibilityHighlight: String(required(scheme.eligibilityHighlight, 'eligibilityHighlight')),
        eligibilityDetails: String(required(scheme.eligibilityDetails, 'eligibilityDetails')),
        whoCanApply: String(required(scheme.whoCanApply, 'whoCanApply')),
        ageMin: scheme.ageMin ?? null,
        ageMax: scheme.ageMax ?? null,
        incomeMax: scheme.incomeMax ?? null,
        educationRequirements: scheme.educationRequirements || null,
        locationRequirements: scheme.locationRequirements || null,
        applicationProcedure: String(required(scheme.applicationProcedure, 'applicationProcedure')),
        deadline: scheme.deadline || null,
        officialApplicationUrl: officialUrl(scheme.officialApplicationUrl, 'officialApplicationUrl'),
        officialSourceUrl: officialUrl(scheme.officialSourceUrl, 'officialSourceUrl'),
        lastUpdated: required(scheme.lastUpdated, 'lastUpdated'),
        documents: Array.isArray(scheme.documents) ? scheme.documents : [],
        rules: scheme.rules && typeof scheme.rules === 'object' ? scheme.rules : {},
    };
    if (!['central', 'state'].includes(normalized.scope)) throw new Error(`${normalized.id}: invalid scope`);
    if (!normalized.documents.length) throw new Error(`${normalized.id}: documents are required`);
    return normalized;
}

async function importSchemes(filePath) {
    const raw = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const records = Array.isArray(raw) ? raw : raw.schemes;
    if (!Array.isArray(records) || !records.length) throw new Error('The scheme catalogue is empty');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const scheme of records.map(normalizeScheme)) {
            await client.query(`
                INSERT INTO schemes (id, name, short_description, description, benefits, scope, state, eligibility_highlight, eligibility_details, who_can_apply, age_min, age_max, income_max, education_requirements, location_requirements, application_procedure, deadline, official_application_url, official_source_url, last_updated)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
                ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, short_description=EXCLUDED.short_description, description=EXCLUDED.description, benefits=EXCLUDED.benefits, scope=EXCLUDED.scope, state=EXCLUDED.state, eligibility_highlight=EXCLUDED.eligibility_highlight, eligibility_details=EXCLUDED.eligibility_details, who_can_apply=EXCLUDED.who_can_apply, age_min=EXCLUDED.age_min, age_max=EXCLUDED.age_max, income_max=EXCLUDED.income_max, education_requirements=EXCLUDED.education_requirements, location_requirements=EXCLUDED.location_requirements, application_procedure=EXCLUDED.application_procedure, deadline=EXCLUDED.deadline, official_application_url=EXCLUDED.official_application_url, official_source_url=EXCLUDED.official_source_url, last_updated=EXCLUDED.last_updated, imported_at=NOW()
            `, [scheme.id, scheme.name, scheme.shortDescription, scheme.description, scheme.benefits, scheme.scope, scheme.state, scheme.eligibilityHighlight, scheme.eligibilityDetails, scheme.whoCanApply, scheme.ageMin, scheme.ageMax, scheme.incomeMax, scheme.educationRequirements, scheme.locationRequirements, scheme.applicationProcedure, scheme.deadline, scheme.officialApplicationUrl, scheme.officialSourceUrl, scheme.lastUpdated]);
            await client.query('DELETE FROM scheme_documents WHERE scheme_id = $1', [scheme.id]);
            for (const document of scheme.documents) {
                await client.query('INSERT INTO scheme_documents (scheme_id, document_type, required) VALUES ($1, $2, $3)', [scheme.id, String(document.name || document), document.required !== false]);
            }
            await client.query('INSERT INTO scheme_eligibility_rules (scheme_id, rules) VALUES ($1, $2) ON CONFLICT (scheme_id) DO UPDATE SET rules=EXCLUDED.rules', [scheme.id, JSON.stringify(scheme.rules)]);
        }
        await client.query('COMMIT');
        return records.length;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function initializeDatabase(root) {
    const schema = await fs.readFile(path.join(root, 'server', 'schema.sql'), 'utf8');
    await pool.query(schema);
    const count = await importSchemes(path.join(root, 'approved-schemes.json'));
    console.log(`Database ready. Imported ${count} scheme records.`);
}
