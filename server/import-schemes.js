import fs from 'node:fs/promises';
import process from 'node:process';
import { pool, query } from './db.js';

const inputPath = process.argv[2];
function required(value, field) {
    if (value === undefined || value === null || value === '') throw new Error(`Missing ${field}`);
    return value;
}

function officialUrl(value, field) {
    const url = new URL(required(value, field));
    if (url.protocol !== 'https:') {
        throw new Error(`${field} must be an HTTPS URL`);
    }
    return url.toString();
}

function validateScheme(scheme) {
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
    if (!['central', 'state'].includes(normalized.scope)) throw new Error(`${normalized.id}: scope must be central or state`);
    if (!normalized.documents.length) throw new Error(`${normalized.id}: at least one required document is required`);
    return normalized;
}

if (!inputPath) {
    console.error('Usage: npm run import:schemes -- ./path/to/approved-myscheme-export.json');
    process.exitCode = 1;
} else {
    try {
        const raw = JSON.parse(await fs.readFile(inputPath, 'utf8'));
        const records = Array.isArray(raw) ? raw : raw.schemes;
        if (!Array.isArray(records) || !records.length) throw new Error('Input must contain a non-empty schemes array');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const scheme of records.map(validateScheme)) {
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
            console.log(`Imported ${records.length} verified scheme records.`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Scheme import failed:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}
