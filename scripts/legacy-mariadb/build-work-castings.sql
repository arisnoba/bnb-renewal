SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`castings`;

CREATE TABLE `bnb_legacy_work`.`castings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `person_name` varchar(255) NOT NULL,
  `company` varchar(255) NOT NULL,
  `centers` longtext NOT NULL CHECK (JSON_VALID(`centers`)),
  `body_html` mediumtext DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `author_name` varchar(255) DEFAULT NULL,
  `published_at` datetime NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `castings_person_name_idx` (`person_name`),
  UNIQUE KEY `castings_slug_idx` (`slug`),
  KEY `castings_company_idx` (`company`),
  KEY `castings_source_idx` (`source_db`, `source_table`, `source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TEMPORARY TABLE IF EXISTS `tmp_casting_people`;

CREATE TEMPORARY TABLE `tmp_casting_people` (
  `person_name` varchar(255) NOT NULL,
  `company` varchar(255) NOT NULL,
  `preferred_table` varchar(64) NOT NULL,
  PRIMARY KEY (`person_name`)
) ENGINE=Memory DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tmp_casting_people` (`person_name`, `company`, `preferred_table`) VALUES
('오재동', 'BNN CASTING', 'g5_write_new_casting_enm'),
('양형서', 'BNN CASTING', 'g5_write_new_casting_enm'),
('신주현', 'BNN CASTING', 'g5_write_new_casting_enm'),
('김건보', 'U CASTING', 'g5_write_new_casting2'),
('홍진희', 'U CASTING', 'g5_write_new_casting2'),
('표미희', 'IMGround', 'g5_write_new_casting_img'),
('이덕화', 'BX Model Agency', 'g5_write_new_casting_bx'),
('김하나', 'BX Model Agency', 'g5_write_new_casting_bx'),
('최길홍', '라인업', 'g5_write_new_casting'),
('박소현', '라인업', 'g5_write_new_casting');

DROP TEMPORARY TABLE IF EXISTS `tmp_castings_all`;

CREATE TEMPORARY TABLE `tmp_castings_all` AS
SELECT 'baewoo' AS `source_db`, 'art' AS `center`, 1 AS `source_priority`, 'g5_write_new_casting' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `baewoo`.`g5_write_new_casting`
UNION ALL
SELECT 'baewoo', 'art', 1, 'g5_write_new_casting2',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `baewoo`.`g5_write_new_casting2`
UNION ALL
SELECT 'baewoo', 'art', 1, 'g5_write_new_casting3',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, NULL
FROM `baewoo`.`g5_write_new_casting3`
UNION ALL
SELECT 'baewoo', 'art', 1, 'g5_write_new_casting_abio',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, NULL
FROM `baewoo`.`g5_write_new_casting_abio`
UNION ALL
SELECT 'baewoo', 'art', 1, 'g5_write_new_casting_bx',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, NULL
FROM `baewoo`.`g5_write_new_casting_bx`
UNION ALL
SELECT 'bnbhighteen', 'highteen', 2, 'g5_write_new_casting',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `bnbhighteen`.`g5_write_new_casting`
UNION ALL
SELECT 'bnbhighteen', 'highteen', 2, 'g5_write_new_casting2',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `bnbhighteen`.`g5_write_new_casting2`
UNION ALL
SELECT 'bnbhighteen', 'highteen', 2, 'g5_write_new_casting3',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, NULL
FROM `bnbhighteen`.`g5_write_new_casting3`
UNION ALL
SELECT 'bnbhighteen', 'highteen', 2, 'g5_write_new_casting_bx',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `bnbhighteen`.`g5_write_new_casting_bx`
UNION ALL
SELECT 'bnbhighteen', 'highteen', 2, 'g5_write_new_casting_enm',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `bnbhighteen`.`g5_write_new_casting_enm`
UNION ALL
SELECT 'bnbhighteen', 'highteen', 2, 'g5_write_new_casting_img',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `bnbhighteen`.`g5_write_new_casting_img`
UNION ALL
SELECT 'bnbuniv', 'exam', 3, 'g5_write_new_casting',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, NULL
FROM `bnbuniv`.`g5_write_new_casting`
UNION ALL
SELECT 'kidscenter', 'kids', 4, 'g5_write_new_casting',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `kidscenter`.`g5_write_new_casting`
UNION ALL
SELECT 'kidscenter', 'kids', 4, 'g5_write_new_casting2',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `kidscenter`.`g5_write_new_casting2`
UNION ALL
SELECT 'kidscenter', 'kids', 4, 'g5_write_new_casting_bx',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `kidscenter`.`g5_write_new_casting_bx`
UNION ALL
SELECT 'kidscenter', 'kids', 4, 'g5_write_new_casting_enm',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `kidscenter`.`g5_write_new_casting_enm`
UNION ALL
SELECT 'kidscenter', 'kids', 4, 'g5_write_new_casting_img',
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `kidscenter`.`g5_write_new_casting_img`;

DROP TEMPORARY TABLE IF EXISTS `tmp_casting_candidates`;

CREATE TEMPORARY TABLE `tmp_casting_candidates` AS
SELECT
  `casting`.*,
  `people`.`person_name`,
  `people`.`company`,
  `people`.`preferred_table`,
  IF(`casting`.`source_table` = `people`.`preferred_table`, 0, 1) AS `preferred_rank`,
  CHAR_LENGTH(COALESCE(`casting`.`wr_content`, '')) AS `body_score`
FROM `tmp_castings_all` AS `casting`
JOIN `tmp_casting_people` AS `people`
  ON `people`.`person_name` = TRIM(`casting`.`wr_subject`)
WHERE `casting`.`wr_is_comment` = 0;

DROP TEMPORARY TABLE IF EXISTS `tmp_casting_representatives`;

CREATE TEMPORARY TABLE `tmp_casting_representatives` AS
SELECT *
FROM (
  SELECT
    `tmp_casting_candidates`.*,
    ROW_NUMBER() OVER (
      PARTITION BY `person_name`
      ORDER BY `preferred_rank`, `body_score` DESC, `source_priority`, `wr_id`
    ) AS `representative_rank`
  FROM `tmp_casting_candidates`
) AS `ranked_castings`
WHERE `representative_rank` = 1;

INSERT INTO `bnb_legacy_work`.`castings` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `person_name`,
  `company`,
  `centers`,
  `body_html`,
  `category`,
  `author_name`,
  `published_at`,
  `is_public`,
  `created_at`,
  `updated_at`,
  `legacy_meta`
)
SELECT
  `representative`.`source_db`,
  `representative`.`source_table`,
  `representative`.`wr_id` AS `source_id`,
  CONCAT('casting-', REPLACE(LOWER(`representative`.`company`), ' ', '-'), '-', `representative`.`wr_id`) AS `slug`,
  `representative`.`person_name`,
  `representative`.`company`,
  (
    SELECT CONCAT('[', GROUP_CONCAT(DISTINCT JSON_QUOTE(`source`.`center`) ORDER BY FIELD(`source`.`center`, 'art', 'highteen', 'exam', 'kids') SEPARATOR ','), ']')
    FROM `tmp_casting_candidates` AS `source`
    WHERE `source`.`person_name` = `representative`.`person_name`
  ) AS `centers`,
  NULLIF(`representative`.`wr_content`, '') AS `body_html`,
  NULLIF(TRIM(`representative`.`ca_name`), '') AS `category`,
  NULLIF(TRIM(`representative`.`wr_name`), '') AS `author_name`,
  COALESCE(NULLIF(`representative`.`wr_datetime`, '0000-00-00 00:00:00'), CURRENT_TIMESTAMP) AS `published_at`,
  IF(COALESCE(TRIM(`representative`.`public`), '') = '0' OR UPPER(COALESCE(TRIM(`representative`.`public`), '')) = 'N', 0, 1) AS `is_public`,
  COALESCE(NULLIF(`representative`.`wr_datetime`, '0000-00-00 00:00:00'), CURRENT_TIMESTAMP) AS `created_at`,
  CURRENT_TIMESTAMP AS `updated_at`,
  JSON_OBJECT(
    'selectedSource', JSON_OBJECT(
      'sourceDb', `representative`.`source_db`,
      'center', `representative`.`center`,
      'sourceTable', `representative`.`source_table`,
      'sourceId', `representative`.`wr_id`,
      'preferredTable', `representative`.`preferred_table`
    ),
    'sources', (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'sourceDb', `source`.`source_db`,
          'center', `source`.`center`,
          'sourceTable', `source`.`source_table`,
          'sourceId', `source`.`wr_id`,
          'personName', `source`.`wr_subject`,
          'publishedAt', `source`.`wr_datetime`,
          'bodyLength', `source`.`body_score`
        )
        ORDER BY `source`.`preferred_rank`, `source`.`source_priority`, `source`.`source_table`, `source`.`wr_id`
      )
      FROM `tmp_casting_candidates` AS `source`
      WHERE `source`.`person_name` = `representative`.`person_name`
    ),
    'rawFields', JSON_OBJECT(
      'wr1', `representative`.`wr_1`,
      'wr2', `representative`.`wr_2`,
      'wr3', `representative`.`wr_3`,
      'wr4', `representative`.`wr_4`,
      'wr5', `representative`.`wr_5`,
      'wr6', `representative`.`wr_6`,
      'wr7', `representative`.`wr_7`,
      'wr8', `representative`.`wr_8`,
      'wr9', `representative`.`wr_9`,
      'wr10', `representative`.`wr_10`
    ),
    'wrFile', NULLIF(TRIM(`representative`.`wr_file`), ''),
    'wrHit', `representative`.`wr_hit`,
    'wrParent', `representative`.`wr_parent`,
    'wrNum', `representative`.`wr_num`,
    'wrOption', NULLIF(TRIM(`representative`.`wr_option`), ''),
    'links', JSON_OBJECT(
      'link1', NULLIF(TRIM(`representative`.`wr_link1`), ''),
      'link2', NULLIF(TRIM(`representative`.`wr_link2`), ''),
      'link1Hit', `representative`.`wr_link1_hit`,
      'link2Hit', `representative`.`wr_link2_hit`
    )
  ) AS `legacy_meta`
FROM `tmp_casting_representatives` AS `representative`
ORDER BY `representative`.`company`, `representative`.`person_name`;
