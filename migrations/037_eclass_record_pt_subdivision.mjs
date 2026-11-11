// Migration: 037_eclass_record_pt_subdivision.mjs
// Description: Add split_pt, weight_rec, weight_sw, rec_hps, and sw_hps columns
// to class_record_configs for sub-dividing Performance Tasks into Recitation
// and Performance Task / Seatwork per teacher configuration.
// Schema-only migration; zero operational seeding.

export const id = '037_eclass_record_pt_subdivision'
export const description = 'Add PT sub-division columns (Recitation and Seatwork) to class_record_configs'

async function addColumn(run, sql) {
  try {
    await run(sql)
  } catch (error) {
    const message = String(error.message || error.code || '')
    if (!/duplicate|already exists|exists|ER_DUP_FIELDNAME/i.test(message)) throw error
  }
}

export async function up({ run, isMysql }) {
  if (isMysql) {
    await addColumn(run, 'ALTER TABLE class_record_configs ADD COLUMN split_pt TINYINT(1) NOT NULL DEFAULT 0')
    await addColumn(run, 'ALTER TABLE class_record_configs ADD COLUMN weight_rec INT NOT NULL DEFAULT 20')
    await addColumn(run, 'ALTER TABLE class_record_configs ADD COLUMN weight_sw INT NOT NULL DEFAULT 30')
    await addColumn(run, 'ALTER TABLE class_record_configs ADD COLUMN rec_hps TEXT NULL')
    await addColumn(run, 'ALTER TABLE class_record_configs ADD COLUMN sw_hps TEXT NULL')
  } else {
    await addColumn(run, 'ALTER TABLE class_record_configs ADD COLUMN split_pt INTEGER NOT NULL DEFAULT 0')
    await addColumn(run, 'ALTER TABLE class_record_configs ADD COLUMN weight_rec INTEGER NOT NULL DEFAULT 20')
    await addColumn(run, 'ALTER TABLE class_record_configs ADD COLUMN weight_sw INTEGER NOT NULL DEFAULT 30')
    await addColumn(run, "ALTER TABLE class_record_configs ADD COLUMN rec_hps TEXT NOT NULL DEFAULT '[]'")
    await addColumn(run, "ALTER TABLE class_record_configs ADD COLUMN sw_hps TEXT NOT NULL DEFAULT '[]'")
  }
}

export async function down({ run }) {
  try { await run('ALTER TABLE class_record_configs DROP COLUMN split_pt') } catch {}
  try { await run('ALTER TABLE class_record_configs DROP COLUMN weight_rec') } catch {}
  try { await run('ALTER TABLE class_record_configs DROP COLUMN weight_sw') } catch {}
  try { await run('ALTER TABLE class_record_configs DROP COLUMN rec_hps') } catch {}
  try { await run('ALTER TABLE class_record_configs DROP COLUMN sw_hps') } catch {}
}
