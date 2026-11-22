-- Migration 075: Seed default exam categories for foreign key constraint safety
INSERT IGNORE INTO public_exam_categories (id, name, slug, description, status) VALUES 
('cat-food-safety-001', 'Food Safety Standards', 'food-safety-standards', 'International food safety and hygiene qualification standards', 'active'),
('cat-mgmt-systems-002', 'Management Systems', 'management-systems', 'ISO and enterprise quality management systems', 'active'),
('cat-gfsi-standards-003', 'Global GFSI Standards', 'global-gfsi-standards', 'GFSI benchmarked global manufacturing standards', 'active');
