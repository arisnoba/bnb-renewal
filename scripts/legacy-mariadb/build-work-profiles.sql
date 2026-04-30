SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`profiles`;

CREATE TABLE `bnb_legacy_work`.`profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `center` varchar(32) NOT NULL,
  `filter` varchar(32) NOT NULL,
  `name` varchar(255) NOT NULL,
  `height` varchar(64) DEFAULT NULL,
  `weight` varchar(64) DEFAULT NULL,
  `english_name` varchar(255) DEFAULT NULL,
  `profile_image_path` varchar(512) DEFAULT NULL,
  `photo_image1` varchar(512) DEFAULT NULL,
  `photo_image2` varchar(512) DEFAULT NULL,
  `photo_image3` varchar(512) DEFAULT NULL,
  `photo_image4` varchar(512) DEFAULT NULL,
  `photo_image5` varchar(512) DEFAULT NULL,
  `photo_image6` varchar(512) DEFAULT NULL,
  `body_html` mediumtext DEFAULT NULL,
  `author_name` varchar(255) DEFAULT NULL,
  `published_at` datetime NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profiles_slug_idx` (`slug`),
  UNIQUE KEY `profiles_source_idx` (`source_db`, `source_table`, `source_id`),
  KEY `profiles_center_filter_idx` (`center`, `filter`),
  KEY `profiles_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TEMPORARY TABLE IF EXISTS `tmp_profiles_all`;

CREATE TEMPORARY TABLE `tmp_profiles_all` AS
SELECT
  'baewoo' AS `source_db`,
  'art' AS `center`,
  'g5_write_new_profile' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`
FROM `baewoo`.`g5_write_new_profile`
WHERE `wr_is_comment` = 0
  AND UPPER(TRIM(`ca_name`)) IN ('MEN', 'WOMEN')
UNION ALL
SELECT
  'bnbhighteen' AS `source_db`,
  'highteen' AS `center`,
  'g5_write_new_profile' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`
FROM `bnbhighteen`.`g5_write_new_profile`
WHERE `wr_is_comment` = 0
  AND UPPER(TRIM(`ca_name`)) IN ('MEN', 'WOMEN')
UNION ALL
SELECT
  'kidscenter' AS `source_db`,
  'kids' AS `center`,
  'g5_write_new_profile' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`
FROM `kidscenter`.`g5_write_new_profile`
WHERE `wr_is_comment` = 0
  AND TRIM(`ca_name`) IN (
    '베이비', '베이비키즈',
    '주니어', '쥬니어', '주니어키즈', '쥬니어키즈',
    '시니어', '시니어키즈'
  );

DROP TEMPORARY TABLE IF EXISTS `tmp_profile_file_sources`;

CREATE TEMPORARY TABLE `tmp_profile_file_sources` AS
SELECT 'baewoo' AS `source_db`, `bo_table`, `wr_id`, `bf_no`, `bf_file`
FROM `baewoo`.`g5_board_file`
WHERE NULLIF(TRIM(`bf_file`), '') IS NOT NULL
UNION ALL
SELECT 'bnbuniv' AS `source_db`, `bo_table`, `wr_id`, `bf_no`, `bf_file`
FROM `bnbuniv`.`g5_board_file`
WHERE NULLIF(TRIM(`bf_file`), '') IS NOT NULL
UNION ALL
SELECT 'kidscenter' AS `source_db`, `bo_table`, `wr_id`, `bf_no`, `bf_file`
FROM `kidscenter`.`g5_board_file`
WHERE NULLIF(TRIM(`bf_file`), '') IS NOT NULL
UNION ALL
SELECT 'bnbhighteen' AS `source_db`, `bo_table`, `wr_id`, `bf_no`, `bf_file`
FROM `bnbhighteen`.`g5_board_file`
WHERE NULLIF(TRIM(`bf_file`), '') IS NOT NULL;

INSERT INTO `bnb_legacy_work`.`profiles` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `center`,
  `filter`,
  `name`,
  `height`,
  `weight`,
  `english_name`,
  `profile_image_path`,
  `photo_image1`,
  `photo_image2`,
  `photo_image3`,
  `photo_image4`,
  `photo_image5`,
  `photo_image6`,
  `body_html`,
  `author_name`,
  `published_at`,
  `created_at`,
  `updated_at`,
  `legacy_meta`
)
SELECT
  `profile`.`source_db`,
  `profile`.`source_table`,
  `profile`.`wr_id` AS `source_id`,
  CONCAT('profile-', `profile`.`source_db`, '-', `profile`.`wr_id`) AS `slug`,
  `profile`.`center`,
  CASE
    WHEN `profile`.`center` IN ('art', 'highteen') AND UPPER(TRIM(`profile`.`ca_name`)) = 'MEN' THEN 'men'
    WHEN `profile`.`center` IN ('art', 'highteen') AND UPPER(TRIM(`profile`.`ca_name`)) = 'WOMEN' THEN 'women'
    WHEN `profile`.`center` = 'kids' AND TRIM(`profile`.`ca_name`) IN ('베이비', '베이비키즈') THEN '베이비'
    WHEN `profile`.`center` = 'kids' AND TRIM(`profile`.`ca_name`) IN ('주니어', '쥬니어', '주니어키즈', '쥬니어키즈') THEN '주니어'
    WHEN `profile`.`center` = 'kids' AND TRIM(`profile`.`ca_name`) IN ('시니어', '시니어키즈') THEN '시니어'
    ELSE TRIM(`profile`.`ca_name`)
  END AS `filter`,
  NULLIF(TRIM(`profile`.`wr_subject`), '') AS `name`,
  NULLIF(TRIM(`profile`.`wr_1`), '') AS `height`,
  NULLIF(TRIM(`profile`.`wr_2`), '') AS `weight`,
  NULLIF(TRIM(`profile`.`wr_3`), '') AS `english_name`,
  (
    SELECT CONCAT(
      '/legacy/profiles/',
      `profile`.`source_db`,
      '/',
      REPLACE(`profile`.`source_table`, 'g5_write_', ''),
      '/',
      `profile`.`wr_id`,
      '/',
      `file_source`.`bf_file`
    )
    FROM `tmp_profile_file_sources` AS `file_source`
    WHERE `file_source`.`source_db` = `profile`.`source_db`
      AND `file_source`.`bo_table` = REPLACE(`profile`.`source_table`, 'g5_write_', '')
      AND `file_source`.`wr_id` = `profile`.`wr_id`
    ORDER BY `file_source`.`bf_no` ASC
    LIMIT 1
  ) AS `profile_image_path`,
  (
    SELECT CONCAT('/legacy/profiles/', `profile`.`source_db`, '/', REPLACE(`profile`.`source_table`, 'g5_write_', ''), '/', `profile`.`wr_id`, '/', `file_source`.`bf_file`)
    FROM `tmp_profile_file_sources` AS `file_source`
    WHERE `file_source`.`source_db` = `profile`.`source_db`
      AND `file_source`.`bo_table` = REPLACE(`profile`.`source_table`, 'g5_write_', '')
      AND `file_source`.`wr_id` = `profile`.`wr_id`
    ORDER BY `file_source`.`bf_no` ASC
    LIMIT 1 OFFSET 1
  ) AS `photo_image1`,
  (
    SELECT CONCAT('/legacy/profiles/', `profile`.`source_db`, '/', REPLACE(`profile`.`source_table`, 'g5_write_', ''), '/', `profile`.`wr_id`, '/', `file_source`.`bf_file`)
    FROM `tmp_profile_file_sources` AS `file_source`
    WHERE `file_source`.`source_db` = `profile`.`source_db`
      AND `file_source`.`bo_table` = REPLACE(`profile`.`source_table`, 'g5_write_', '')
      AND `file_source`.`wr_id` = `profile`.`wr_id`
    ORDER BY `file_source`.`bf_no` ASC
    LIMIT 1 OFFSET 2
  ) AS `photo_image2`,
  (
    SELECT CONCAT('/legacy/profiles/', `profile`.`source_db`, '/', REPLACE(`profile`.`source_table`, 'g5_write_', ''), '/', `profile`.`wr_id`, '/', `file_source`.`bf_file`)
    FROM `tmp_profile_file_sources` AS `file_source`
    WHERE `file_source`.`source_db` = `profile`.`source_db`
      AND `file_source`.`bo_table` = REPLACE(`profile`.`source_table`, 'g5_write_', '')
      AND `file_source`.`wr_id` = `profile`.`wr_id`
    ORDER BY `file_source`.`bf_no` ASC
    LIMIT 1 OFFSET 3
  ) AS `photo_image3`,
  (
    SELECT CONCAT('/legacy/profiles/', `profile`.`source_db`, '/', REPLACE(`profile`.`source_table`, 'g5_write_', ''), '/', `profile`.`wr_id`, '/', `file_source`.`bf_file`)
    FROM `tmp_profile_file_sources` AS `file_source`
    WHERE `file_source`.`source_db` = `profile`.`source_db`
      AND `file_source`.`bo_table` = REPLACE(`profile`.`source_table`, 'g5_write_', '')
      AND `file_source`.`wr_id` = `profile`.`wr_id`
    ORDER BY `file_source`.`bf_no` ASC
    LIMIT 1 OFFSET 4
  ) AS `photo_image4`,
  (
    SELECT CONCAT('/legacy/profiles/', `profile`.`source_db`, '/', REPLACE(`profile`.`source_table`, 'g5_write_', ''), '/', `profile`.`wr_id`, '/', `file_source`.`bf_file`)
    FROM `tmp_profile_file_sources` AS `file_source`
    WHERE `file_source`.`source_db` = `profile`.`source_db`
      AND `file_source`.`bo_table` = REPLACE(`profile`.`source_table`, 'g5_write_', '')
      AND `file_source`.`wr_id` = `profile`.`wr_id`
    ORDER BY `file_source`.`bf_no` ASC
    LIMIT 1 OFFSET 5
  ) AS `photo_image5`,
  (
    SELECT CONCAT('/legacy/profiles/', `profile`.`source_db`, '/', REPLACE(`profile`.`source_table`, 'g5_write_', ''), '/', `profile`.`wr_id`, '/', `file_source`.`bf_file`)
    FROM `tmp_profile_file_sources` AS `file_source`
    WHERE `file_source`.`source_db` = `profile`.`source_db`
      AND `file_source`.`bo_table` = REPLACE(`profile`.`source_table`, 'g5_write_', '')
      AND `file_source`.`wr_id` = `profile`.`wr_id`
    ORDER BY `file_source`.`bf_no` ASC
    LIMIT 1 OFFSET 6
  ) AS `photo_image6`,
  NULLIF(`profile`.`wr_content`, '') AS `body_html`,
  NULLIF(TRIM(`profile`.`wr_name`), '') AS `author_name`,
  COALESCE(NULLIF(`profile`.`wr_datetime`, '0000-00-00 00:00:00'), CURRENT_TIMESTAMP) AS `published_at`,
  COALESCE(NULLIF(`profile`.`wr_datetime`, '0000-00-00 00:00:00'), CURRENT_TIMESTAMP) AS `created_at`,
  CURRENT_TIMESTAMP AS `updated_at`,
  JSON_OBJECT(
    'sourceDb', `profile`.`source_db`,
    'sourceTable', `profile`.`source_table`,
    'sourceId', `profile`.`wr_id`,
    'rawCategory', `profile`.`ca_name`,
    'rawFields', JSON_OBJECT(
      'wr1', `profile`.`wr_1`,
      'wr2', `profile`.`wr_2`,
      'wr3', `profile`.`wr_3`,
      'wr4', `profile`.`wr_4`,
      'wr5', `profile`.`wr_5`,
      'wr6', `profile`.`wr_6`,
      'wr7', `profile`.`wr_7`,
      'wr8', `profile`.`wr_8`,
      'wr9', `profile`.`wr_9`,
      'wr10', `profile`.`wr_10`
    ),
    'wrFile', NULLIF(TRIM(`profile`.`wr_file`), ''),
    'wrHit', `profile`.`wr_hit`,
    'wrParent', `profile`.`wr_parent`,
    'wrNum', `profile`.`wr_num`,
    'wrOption', NULLIF(TRIM(`profile`.`wr_option`), ''),
    'links', JSON_OBJECT(
      'link1', NULLIF(TRIM(`profile`.`wr_link1`), ''),
      'link2', NULLIF(TRIM(`profile`.`wr_link2`), ''),
      'link1Hit', `profile`.`wr_link1_hit`,
      'link2Hit', `profile`.`wr_link2_hit`
    )
  ) AS `legacy_meta`
FROM `tmp_profiles_all` AS `profile`
WHERE NULLIF(TRIM(`profile`.`wr_subject`), '') IS NOT NULL
ORDER BY `profile`.`center`, `filter`, `profile`.`wr_id`;
