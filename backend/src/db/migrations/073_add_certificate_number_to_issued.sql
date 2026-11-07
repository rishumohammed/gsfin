-- 073_add_certificate_number_to_issued.sql
-- Add certificate_number to public_exam_issued_certificates for standardized GSFIN certificate tracking

ALTER TABLE public_exam_issued_certificates 
  ADD COLUMN certificate_number VARCHAR(100) NULL;

