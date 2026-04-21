BEGIN;

WITH mapping(name, centers) AS (
  VALUES
    ('김예진', ARRAY['exam','kids','highteen']::enum_teachers_center[]),
    ('송민지', ARRAY['art','kids','highteen']::enum_teachers_center[]),
    ('안서진', ARRAY['exam','kids','highteen']::enum_teachers_center[]),
    ('황해리', ARRAY['exam','kids','highteen']::enum_teachers_center[]),
    ('김미지', ARRAY['kids','highteen']::enum_teachers_center[]),
    ('김민식', ARRAY['art','exam']::enum_teachers_center[]),
    ('김예슬', ARRAY['exam','highteen']::enum_teachers_center[]),
    ('김한수', ARRAY['art','exam']::enum_teachers_center[]),
    ('박소현', ARRAY['exam','highteen']::enum_teachers_center[]),
    ('송예준', ARRAY['exam','kids']::enum_teachers_center[]),
    ('안서영', ARRAY['exam','kids']::enum_teachers_center[]),
    ('양서윤', ARRAY['exam','highteen']::enum_teachers_center[]),
    ('이연주', ARRAY['exam','kids']::enum_teachers_center[]),
    ('이재혜', ARRAY['kids','highteen']::enum_teachers_center[]),
    ('이현진', ARRAY['kids','highteen']::enum_teachers_center[]),
    ('인규식', ARRAY['exam','highteen']::enum_teachers_center[]),
    ('장인섭', ARRAY['art','exam']::enum_teachers_center[]),
    ('전범진', ARRAY['exam','highteen']::enum_teachers_center[]),
    ('정태건', ARRAY['exam','highteen']::enum_teachers_center[]),
    ('강나리', ARRAY['art']::enum_teachers_center[]),
    ('강현우', ARRAY['art']::enum_teachers_center[]),
    ('김민하', ARRAY['art']::enum_teachers_center[]),
    ('김정훈', ARRAY['art']::enum_teachers_center[]),
    ('김한나', ARRAY['art']::enum_teachers_center[]),
    ('박세준', ARRAY['art']::enum_teachers_center[]),
    ('박정복', ARRAY['art']::enum_teachers_center[]),
    ('박주환', ARRAY['art']::enum_teachers_center[]),
    ('박지홍', ARRAY['art']::enum_teachers_center[]),
    ('박진감', ARRAY['art']::enum_teachers_center[]),
    ('변준호', ARRAY['art']::enum_teachers_center[]),
    ('송덕호', ARRAY['art']::enum_teachers_center[]),
    ('송유현', ARRAY['art']::enum_teachers_center[]),
    ('안창환', ARRAY['art']::enum_teachers_center[]),
    ('여민구', ARRAY['art']::enum_teachers_center[]),
    ('오륭', ARRAY['art']::enum_teachers_center[]),
    ('오정택', ARRAY['art']::enum_teachers_center[]),
    ('유하나', ARRAY['art']::enum_teachers_center[]),
    ('이달', ARRAY['art']::enum_teachers_center[]),
    ('이승원', ARRAY['art']::enum_teachers_center[]),
    ('이운산', ARRAY['art']::enum_teachers_center[]),
    ('장찬호', ARRAY['art']::enum_teachers_center[]),
    ('정유미', ARRAY['art']::enum_teachers_center[]),
    ('조재영', ARRAY['art']::enum_teachers_center[]),
    ('진예솔', ARRAY['art']::enum_teachers_center[]),
    ('하태건', ARRAY['art']::enum_teachers_center[]),
    ('한서이', ARRAY['art']::enum_teachers_center[]),
    ('홍주혜', ARRAY['art']::enum_teachers_center[]),
    ('강민경', ARRAY['exam']::enum_teachers_center[]),
    ('곽지원', ARRAY['exam']::enum_teachers_center[]),
    ('김병현', ARRAY['exam']::enum_teachers_center[]),
    ('김보은', ARRAY['exam']::enum_teachers_center[]),
    ('김윤정', ARRAY['exam']::enum_teachers_center[]),
    ('김홍교', ARRAY['exam']::enum_teachers_center[]),
    ('김희원', ARRAY['exam']::enum_teachers_center[]),
    ('류견진', ARRAY['exam']::enum_teachers_center[]),
    ('문혜린', ARRAY['exam']::enum_teachers_center[]),
    ('박범수', ARRAY['exam']::enum_teachers_center[]),
    ('변효준', ARRAY['exam']::enum_teachers_center[]),
    ('신동해', ARRAY['exam']::enum_teachers_center[]),
    ('이다린', ARRAY['exam']::enum_teachers_center[]),
    ('정지영', ARRAY['exam']::enum_teachers_center[]),
    ('최시율', ARRAY['exam']::enum_teachers_center[]),
    ('최은하', ARRAY['exam']::enum_teachers_center[]),
    ('황윤정', ARRAY['exam']::enum_teachers_center[]),
    ('김민정', ARRAY['kids']::enum_teachers_center[]),
    ('김자연', ARRAY['kids']::enum_teachers_center[]),
    ('김현실', ARRAY['kids']::enum_teachers_center[]),
    ('문창준', ARRAY['kids']::enum_teachers_center[]),
    ('민지혜', ARRAY['kids']::enum_teachers_center[]),
    ('이서아', ARRAY['kids']::enum_teachers_center[]),
    ('이서정', ARRAY['kids']::enum_teachers_center[]),
    ('임지은', ARRAY['kids']::enum_teachers_center[]),
    ('강해리', ARRAY['highteen']::enum_teachers_center[]),
    ('권미서', ARRAY['highteen']::enum_teachers_center[]),
    ('박지영', ARRAY['highteen']::enum_teachers_center[]),
    ('신수항', ARRAY['highteen']::enum_teachers_center[]),
    ('오준혁', ARRAY['highteen']::enum_teachers_center[]),
    ('유지연', ARRAY['highteen']::enum_teachers_center[]),
    ('이규학', ARRAY['highteen']::enum_teachers_center[]),
    ('이다빛나', ARRAY['highteen']::enum_teachers_center[]),
    ('이재준', ARRAY['highteen']::enum_teachers_center[])
),
matched AS (
  SELECT t.id, m.centers
  FROM teachers t
  JOIN mapping m ON m.name = t.name
),
deleted AS (
  DELETE FROM teachers_center tc
  USING matched
  WHERE tc.parent_id = matched.id
  RETURNING tc.parent_id
),
inserted AS (
  INSERT INTO teachers_center ("parent_id", "value", "order")
  SELECT
    matched.id,
    center_values.value,
    center_values.ordinality::integer
  FROM matched
  CROSS JOIN LATERAL unnest(matched.centers) WITH ORDINALITY AS center_values(value, ordinality)
  RETURNING parent_id
)
SELECT
  (SELECT COUNT(DISTINCT id) FROM matched) AS matched_records,
  (SELECT COUNT(*) FROM deleted) AS deleted_rows,
  (SELECT COUNT(*) FROM inserted) AS inserted_rows;

COMMIT;
