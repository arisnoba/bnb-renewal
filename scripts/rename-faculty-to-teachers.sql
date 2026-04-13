BEGIN;

ALTER TYPE enum_faculty_center RENAME TO enum_teachers_center;
ALTER TYPE enum_faculty_status RENAME TO enum_teachers_status;

ALTER TABLE faculty RENAME TO teachers;
ALTER TABLE faculty_gallery RENAME TO teachers_gallery;

ALTER SEQUENCE faculty_id_seq RENAME TO teachers_id_seq;
ALTER TABLE teachers ALTER COLUMN id SET DEFAULT nextval('teachers_id_seq'::regclass);

ALTER TABLE teachers RENAME CONSTRAINT faculty_pkey TO teachers_pkey;
ALTER INDEX faculty_created_at_idx RENAME TO teachers_created_at_idx;
ALTER INDEX faculty_slug_idx RENAME TO teachers_slug_idx;
ALTER INDEX faculty_updated_at_idx RENAME TO teachers_updated_at_idx;

ALTER TABLE teachers_gallery RENAME CONSTRAINT faculty_gallery_pkey TO teachers_gallery_pkey;
ALTER TABLE teachers_gallery RENAME CONSTRAINT faculty_gallery_parent_id_fk TO teachers_gallery_parent_id_fk;
ALTER INDEX faculty_gallery_order_idx RENAME TO teachers_gallery_order_idx;
ALTER INDEX faculty_gallery_parent_id_idx RENAME TO teachers_gallery_parent_id_idx;

ALTER TABLE payload_locked_documents_rels RENAME COLUMN faculty_id TO teachers_id;
ALTER INDEX payload_locked_documents_rels_faculty_id_idx RENAME TO payload_locked_documents_rels_teachers_id_idx;
ALTER TABLE payload_locked_documents_rels
  RENAME CONSTRAINT payload_locked_documents_rels_faculty_fk TO payload_locked_documents_rels_teachers_fk;

COMMIT;
