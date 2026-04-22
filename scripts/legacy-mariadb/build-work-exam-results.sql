SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`exam_results`;

CREATE TABLE `bnb_legacy_work`.`exam_results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `center` varchar(32) NOT NULL,
  `result_type` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body_html` mediumtext DEFAULT NULL,
  `thumbnail_url` varchar(512) NOT NULL,
  `thumbnail_path` varchar(512) DEFAULT NULL,
  `thumbnail_source` varchar(32) NOT NULL,
  `published_at` datetime NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_results_slug_idx` (`slug`),
  UNIQUE KEY `exam_results_source_idx` (`source_db`, `source_table`, `source_id`),
  KEY `exam_results_type_idx` (`result_type`),
  KEY `exam_results_published_at_idx` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TEMPORARY TABLE IF EXISTS `tmp_exam_results_all`;

CREATE TEMPORARY TABLE `tmp_exam_results_all` AS
SELECT
  'bnbuniv' AS `source_db`,
  'exam' AS `center`,
  'g5_write_victory10' AS `source_table`,
  'victory10' AS `file_bo_table`,
  'university' AS `result_type`,
  `victory`.`wr_id`, `victory`.`wr_num`, `victory`.`wr_reply`, `victory`.`wr_parent`,
  `victory`.`wr_is_comment`, `victory`.`wr_comment`, `victory`.`wr_comment_reply`,
  `victory`.`ca_name`, `victory`.`wr_option`, `victory`.`wr_subject`, `victory`.`wr_content`,
  `victory`.`wr_link1`, `victory`.`wr_link2`, `victory`.`wr_link1_hit`, `victory`.`wr_link2_hit`,
  `victory`.`wr_hit`, `victory`.`wr_good`, `victory`.`wr_nogood`, `victory`.`mb_id`,
  `victory`.`wr_name`, `victory`.`wr_email`, `victory`.`wr_homepage`, `victory`.`wr_datetime`,
  `victory`.`wr_file`, `victory`.`wr_last`, `victory`.`wr_ip`, `victory`.`wr_facebook_user`,
  `victory`.`wr_twitter_user`, `victory`.`wr_1`, `victory`.`wr_2`, `victory`.`wr_3`,
  `victory`.`wr_4`, `victory`.`wr_5`, `victory`.`wr_6`, `victory`.`wr_7`, `victory`.`wr_8`,
  `victory`.`wr_9`, `victory`.`wr_10`, `victory`.`wr_11`, `victory`.`wr_12`, `victory`.`wr_13`,
  `victory`.`wr_14`, `victory`.`wr_15`, `victory`.`wr_16`, `victory`.`wr_17`, `victory`.`wr_18`,
  `victory`.`wr_19`, `victory`.`wr_20`, `victory`.`wr_21`, `victory`.`wr_22`, `victory`.`wr_23`,
  `victory`.`wr_24`, `victory`.`wr_25`, `victory`.`wr_26`, `victory`.`wr_27`, `victory`.`wr_28`,
  `victory`.`wr_29`, `victory`.`wr_30`, `victory`.`wr_31`, `victory`.`wr_32`,
  `victory`.`public`
FROM `bnbuniv`.`g5_write_victory10` AS `victory`
WHERE `victory`.`wr_is_comment` = 0
UNION ALL
SELECT
  'bnbuniv' AS `source_db`,
  'exam' AS `center`,
  'g5_write_victory30' AS `source_table`,
  'victory30' AS `file_bo_table`,
  'arts_high_school' AS `result_type`,
  `victory`.`wr_id`, `victory`.`wr_num`, `victory`.`wr_reply`, `victory`.`wr_parent`,
  `victory`.`wr_is_comment`, `victory`.`wr_comment`, `victory`.`wr_comment_reply`,
  `victory`.`ca_name`, `victory`.`wr_option`, `victory`.`wr_subject`, `victory`.`wr_content`,
  `victory`.`wr_link1`, `victory`.`wr_link2`, `victory`.`wr_link1_hit`, `victory`.`wr_link2_hit`,
  `victory`.`wr_hit`, `victory`.`wr_good`, `victory`.`wr_nogood`, `victory`.`mb_id`,
  `victory`.`wr_name`, `victory`.`wr_email`, `victory`.`wr_homepage`, `victory`.`wr_datetime`,
  `victory`.`wr_file`, `victory`.`wr_last`, `victory`.`wr_ip`, `victory`.`wr_facebook_user`,
  `victory`.`wr_twitter_user`, `victory`.`wr_1`, `victory`.`wr_2`, `victory`.`wr_3`,
  `victory`.`wr_4`, `victory`.`wr_5`, `victory`.`wr_6`, `victory`.`wr_7`, `victory`.`wr_8`,
  `victory`.`wr_9`, `victory`.`wr_10`, `victory`.`wr_11`, `victory`.`wr_12`, `victory`.`wr_13`,
  `victory`.`wr_14`, `victory`.`wr_15`, `victory`.`wr_16`, `victory`.`wr_17`, `victory`.`wr_18`,
  `victory`.`wr_19`, `victory`.`wr_20`, `victory`.`wr_21`, `victory`.`wr_22`, `victory`.`wr_23`,
  `victory`.`wr_24`, `victory`.`wr_25`, `victory`.`wr_26`, `victory`.`wr_27`, `victory`.`wr_28`,
  `victory`.`wr_29`, `victory`.`wr_30`, `victory`.`wr_31`, `victory`.`wr_32`,
  `victory`.`public`
FROM `bnbuniv`.`g5_write_victory30` AS `victory`
WHERE `victory`.`wr_is_comment` = 0;

DROP TEMPORARY TABLE IF EXISTS `tmp_exam_results_normalized`;

CREATE TEMPORARY TABLE `tmp_exam_results_normalized` AS
SELECT
  `base`.*,
  CASE
    WHEN LOCATE('src="', `base`.`wr_content`) > 0
      AND LOCATE('"', SUBSTRING(`base`.`wr_content`, LOCATE('src="', `base`.`wr_content`) + 5)) > 0
    THEN SUBSTRING(
      SUBSTRING(`base`.`wr_content`, LOCATE('src="', `base`.`wr_content`) + 5),
      1,
      LOCATE('"', SUBSTRING(`base`.`wr_content`, LOCATE('src="', `base`.`wr_content`) + 5)) - 1
    )
    ELSE NULL
  END AS `content_image_url`,
  NULLIF(TRIM(`file`.`bf_file`), '') AS `bf_file`,
  NULLIF(TRIM(`file`.`bf_source`), '') AS `bf_source`,
  NULLIF(TRIM(`file`.`bf_content`), '') AS `bf_content`,
  `file`.`bf_filesize`,
  `file`.`bf_width`,
  `file`.`bf_height`,
  `file`.`bf_type`,
  `file`.`bf_datetime`
FROM `tmp_exam_results_all` AS `base`
LEFT JOIN `bnbuniv`.`g5_board_file` AS `file`
  ON `file`.`bo_table` = `base`.`file_bo_table`
  AND `file`.`wr_id` = `base`.`wr_id`
  AND `file`.`bf_no` = 0
WHERE NULLIF(TRIM(`base`.`wr_subject`), '') IS NOT NULL;

INSERT INTO `bnb_legacy_work`.`exam_results` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `center`,
  `result_type`,
  `title`,
  `body_html`,
  `thumbnail_url`,
  `thumbnail_path`,
  `thumbnail_source`,
  `published_at`,
  `is_public`,
  `created_at`,
  `updated_at`,
  `legacy_meta`
)
SELECT
  `result`.`source_db`,
  `result`.`source_table`,
  `result`.`wr_id` AS `source_id`,
  CONCAT('exam-result-', `result`.`file_bo_table`, '-', `result`.`wr_id`) AS `slug`,
  `result`.`center`,
  `result`.`result_type`,
  NULLIF(TRIM(`result`.`wr_subject`), '') AS `title`,
  NULLIF(`result`.`wr_content`, '') AS `body_html`,
  CASE
    WHEN `result`.`bf_file` IS NOT NULL THEN CONCAT('https://www.baewoo.kr:443/web/data/file/', `result`.`file_bo_table`, '/', `result`.`bf_file`)
    ELSE `result`.`content_image_url`
  END AS `thumbnail_url`,
  CASE
    WHEN `result`.`bf_file` IS NOT NULL THEN CONCAT('/web/data/file/', `result`.`file_bo_table`, '/', `result`.`bf_file`)
    ELSE NULL
  END AS `thumbnail_path`,
  CASE
    WHEN `result`.`bf_file` IS NOT NULL THEN 'board_file'
    ELSE 'content_img'
  END AS `thumbnail_source`,
  COALESCE(NULLIF(`result`.`wr_datetime`, '0000-00-00 00:00:00'), CURRENT_TIMESTAMP) AS `published_at`,
  IF(COALESCE(TRIM(`result`.`public`), '') = '0' OR UPPER(COALESCE(TRIM(`result`.`public`), '')) = 'N', 0, 1) AS `is_public`,
  COALESCE(NULLIF(`result`.`wr_datetime`, '0000-00-00 00:00:00'), CURRENT_TIMESTAMP) AS `created_at`,
  CURRENT_TIMESTAMP AS `updated_at`,
  JSON_OBJECT(
    'sourceDb', `result`.`source_db`,
    'center', `result`.`center`,
    'sourceTable', `result`.`source_table`,
    'sourceId', `result`.`wr_id`,
    'fileBoTable', `result`.`file_bo_table`,
    'resultType', `result`.`result_type`,
    'thumbnail', JSON_OBJECT(
      'source', CASE WHEN `result`.`bf_file` IS NOT NULL THEN 'board_file' ELSE 'content_img' END,
      'url', CASE
        WHEN `result`.`bf_file` IS NOT NULL THEN CONCAT('https://www.baewoo.kr:443/web/data/file/', `result`.`file_bo_table`, '/', `result`.`bf_file`)
        ELSE `result`.`content_image_url`
      END,
      'path', CASE
        WHEN `result`.`bf_file` IS NOT NULL THEN CONCAT('/web/data/file/', `result`.`file_bo_table`, '/', `result`.`bf_file`)
        ELSE NULL
      END,
      'originalName', `result`.`bf_source`,
      'content', `result`.`bf_content`,
      'filesize', `result`.`bf_filesize`,
      'width', `result`.`bf_width`,
      'height', `result`.`bf_height`,
      'type', `result`.`bf_type`,
      'datetime', `result`.`bf_datetime`,
      'contentImageUrl', `result`.`content_image_url`
    ),
    'rawFields', JSON_OBJECT(
      'wr1', `result`.`wr_1`,
      'wr2', `result`.`wr_2`,
      'wr3', `result`.`wr_3`,
      'wr4', `result`.`wr_4`,
      'wr5', `result`.`wr_5`,
      'wr6', `result`.`wr_6`,
      'wr7', `result`.`wr_7`,
      'wr8', `result`.`wr_8`,
      'wr9', `result`.`wr_9`,
      'wr10', `result`.`wr_10`,
      'wr11', `result`.`wr_11`,
      'wr12', `result`.`wr_12`,
      'wr13', `result`.`wr_13`,
      'wr14', `result`.`wr_14`,
      'wr15', `result`.`wr_15`,
      'wr16', `result`.`wr_16`,
      'wr17', `result`.`wr_17`,
      'wr18', `result`.`wr_18`,
      'wr19', `result`.`wr_19`,
      'wr20', `result`.`wr_20`,
      'wr21', `result`.`wr_21`,
      'wr22', `result`.`wr_22`,
      'wr23', `result`.`wr_23`,
      'wr24', `result`.`wr_24`,
      'wr25', `result`.`wr_25`,
      'wr26', `result`.`wr_26`,
      'wr27', `result`.`wr_27`,
      'wr28', `result`.`wr_28`,
      'wr29', `result`.`wr_29`,
      'wr30', `result`.`wr_30`,
      'wr31', `result`.`wr_31`,
      'wr32', `result`.`wr_32`
    ),
    'wrFile', NULLIF(TRIM(`result`.`wr_file`), ''),
    'wrHit', `result`.`wr_hit`,
    'wrParent', `result`.`wr_parent`,
    'wrNum', `result`.`wr_num`,
    'wrOption', NULLIF(TRIM(`result`.`wr_option`), ''),
    'links', JSON_OBJECT(
      'link1', NULLIF(TRIM(`result`.`wr_link1`), ''),
      'link2', NULLIF(TRIM(`result`.`wr_link2`), ''),
      'link1Hit', `result`.`wr_link1_hit`,
      'link2Hit', `result`.`wr_link2_hit`
    )
  ) AS `legacy_meta`
FROM `tmp_exam_results_normalized` AS `result`
WHERE `result`.`bf_file` IS NOT NULL
  OR `result`.`content_image_url` IS NOT NULL
ORDER BY `result`.`wr_datetime` DESC, `result`.`wr_id` DESC;
