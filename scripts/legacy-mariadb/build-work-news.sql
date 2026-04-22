SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`news`;

CREATE TABLE `bnb_legacy_work`.`news` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `center` varchar(32) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `body_html` mediumtext DEFAULT NULL,
  `author_name` varchar(255) DEFAULT NULL,
  `view_count` int(11) NOT NULL DEFAULT 0,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `published_at` datetime NOT NULL,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `news_slug_idx` (`slug`),
  UNIQUE KEY `news_source_idx` (`source_db`, `source_table`, `source_id`),
  KEY `news_center_published_idx` (`center`, `published_at`),
  KEY `news_category_idx` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TEMPORARY TABLE IF EXISTS `tmp_news_all`;

CREATE TEMPORARY TABLE `tmp_news_all` AS
SELECT
  'baewoo' AS `source_db`,
  'art' AS `center`,
  'g5_write_new_notice' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `baewoo`.`g5_write_new_notice`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'bnbuniv' AS `source_db`,
  'exam' AS `center`,
  'g5_write_new_notice' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `bnbuniv`.`g5_write_new_notice`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'kidscenter' AS `source_db`,
  'kids' AS `center`,
  'g5_write_new_notice' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `kidscenter`.`g5_write_new_notice`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'bnbhighteen' AS `source_db`,
  'highteen' AS `center`,
  'g5_write_new_notice' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`, `public`
FROM `bnbhighteen`.`g5_write_new_notice`
WHERE `wr_is_comment` = 0;

INSERT INTO `bnb_legacy_work`.`news` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `center`,
  `category`,
  `title`,
  `body_html`,
  `author_name`,
  `view_count`,
  `is_public`,
  `published_at`,
  `created_at`,
  `updated_at`,
  `legacy_meta`
)
SELECT
  `news`.`source_db`,
  `news`.`source_table`,
  `news`.`wr_id` AS `source_id`,
  CONCAT('news-', `news`.`source_db`, '-', `news`.`wr_id`) AS `slug`,
  `news`.`center`,
  NULLIF(TRIM(`news`.`ca_name`), '') AS `category`,
  NULLIF(TRIM(`news`.`wr_subject`), '') AS `title`,
  NULLIF(`news`.`wr_content`, '') AS `body_html`,
  NULLIF(TRIM(`news`.`wr_name`), '') AS `author_name`,
  COALESCE(`news`.`wr_hit`, 0) AS `view_count`,
  IF(UPPER(TRIM(COALESCE(`news`.`public`, 'Y'))) = 'N', 0, 1) AS `is_public`,
  COALESCE(NULLIF(`news`.`wr_datetime`, '0000-00-00 00:00:00'), '1970-01-01 00:00:00') AS `published_at`,
  COALESCE(NULLIF(`news`.`wr_datetime`, '0000-00-00 00:00:00'), '1970-01-01 00:00:00') AS `created_at`,
  CURRENT_TIMESTAMP AS `updated_at`,
  JSON_OBJECT(
    'sourceDb', `news`.`source_db`,
    'sourceTable', `news`.`source_table`,
    'sourceId', `news`.`wr_id`,
    'center', `news`.`center`,
    'rawCategory', `news`.`ca_name`,
    'wrHit', `news`.`wr_hit`,
    'wrParent', `news`.`wr_parent`,
    'wrNum', `news`.`wr_num`,
    'wrOption', NULLIF(TRIM(`news`.`wr_option`), ''),
    'public', NULLIF(TRIM(`news`.`public`), ''),
    'rawFields', JSON_OBJECT(
      'wr1', `news`.`wr_1`,
      'wr2', `news`.`wr_2`,
      'wr3', `news`.`wr_3`,
      'wr4', `news`.`wr_4`,
      'wr5', `news`.`wr_5`,
      'wr6', `news`.`wr_6`,
      'wr7', `news`.`wr_7`,
      'wr8', `news`.`wr_8`,
      'wr9', `news`.`wr_9`,
      'wr10', `news`.`wr_10`
    ),
    'links', JSON_OBJECT(
      'link1', NULLIF(TRIM(`news`.`wr_link1`), ''),
      'link2', NULLIF(TRIM(`news`.`wr_link2`), ''),
      'link1Hit', `news`.`wr_link1_hit`,
      'link2Hit', `news`.`wr_link2_hit`
    )
  ) AS `legacy_meta`
FROM `tmp_news_all` AS `news`
WHERE NULLIF(TRIM(`news`.`wr_subject`), '') IS NOT NULL
ORDER BY `news`.`center`, `news`.`wr_datetime` DESC, `news`.`wr_id` DESC;
