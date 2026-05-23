-- Update OPD codes and tiketPrefixes to match new format
BEGIN;

UPDATE opds SET code = 'DINKES', tiket_prefix = 'DINKES' WHERE code = 'KES';
UPDATE opds SET code = 'DINDIK', tiket_prefix = 'DINDIK' WHERE code = 'PEND';
UPDATE opds SET code = 'DPUPR', tiket_prefix = 'DPUPR' WHERE code = 'PUPR';
UPDATE opds SET code = 'DPERKIM', tiket_prefix = 'DPERKIM' WHERE code = 'PERKIM';
UPDATE opds SET code = 'POLPP', tiket_prefix = 'POLPP' WHERE code = 'SATPOL';
UPDATE opds SET code = 'DINSOS', tiket_prefix = 'DINSOS' WHERE code = 'SOSIAL';

-- Update existing pengajuan tiketNumbers (format lama → baru)
-- KES/2026/00001 → DINKES-2026-0001
UPDATE pengajuans SET tiket_number = regexp_replace(tiket_number, '^KES/(\d{4})/(\d+)', 'DINKES-\1-\2') WHERE tiket_number ~ '^KES/';
UPDATE pengajuans SET tiket_number = regexp_replace(tiket_number, '^PEND/(\d{4})/(\d+)', 'DINDIK-\1-\2') WHERE tiket_number ~ '^PEND/';
UPDATE pengajuans SET tiket_number = regexp_replace(tiket_number, '^PUPR/(\d{4})/(\d+)', 'DPUPR-\1-\2') WHERE tiket_number ~ '^PUPR/';
UPDATE pengajuans SET tiket_number = regexp_replace(tiket_number, '^PERKIM/(\d{4})/(\d+)', 'DPERKIM-\1-\2') WHERE tiket_number ~ '^PERKIM/';
UPDATE pengajuans SET tiket_number = regexp_replace(tiket_number, '^SATPOL/(\d{4})/(\d+)', 'POLPP-\1-\2') WHERE tiket_number ~ '^SATPOL/';
UPDATE pengajuans SET tiket_number = regexp_replace(tiket_number, '^SOSIAL/(\d{4})/(\d+)', 'DINSOS-\1-\2') WHERE tiket_number ~ '^SOSIAL/';

COMMIT;
