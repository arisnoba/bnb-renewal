SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`exam_passed_videos`;

CREATE TABLE `bnb_legacy_work`.`exam_passed_videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body_html` mediumtext DEFAULT NULL,
  `youtube_code` varchar(64) NOT NULL,
  `youtube_url` varchar(255) NOT NULL,
  `published_at` datetime NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_passed_videos_slug_idx` (`slug`),
  UNIQUE KEY `exam_passed_videos_source_idx` (`source_db`, `source_table`, `source_id`),
  UNIQUE KEY `exam_passed_videos_youtube_code_idx` (`youtube_code`),
  KEY `exam_passed_videos_published_at_idx` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `bnb_legacy_work`.`exam_passed_videos` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `title`,
  `body_html`,
  `youtube_code`,
  `youtube_url`,
  `published_at`,
  `is_public`,
  `created_at`,
  `updated_at`,
  `legacy_meta`
)
SELECT
  'bnbuniv' AS `source_db`,
  'g5_write_new_shoot' AS `source_table`,
  `shoot`.`wr_id` AS `source_id`,
  CONCAT('exam-passed-video-', `shoot`.`wr_id`) AS `slug`,
  NULLIF(TRIM(`shoot`.`wr_subject`), '') AS `title`,
  NULLIF(`shoot`.`wr_content`, '') AS `body_html`,
  NULLIF(TRIM(`shoot`.`wr_2`), '') AS `youtube_code`,
  CONCAT('https://www.youtube.com/watch?v=', TRIM(`shoot`.`wr_2`)) AS `youtube_url`,
  COALESCE(NULLIF(`shoot`.`wr_datetime`, '0000-00-00 00:00:00'), CURRENT_TIMESTAMP) AS `published_at`,
  IF(COALESCE(TRIM(`shoot`.`public`), '') = '0' OR UPPER(COALESCE(TRIM(`shoot`.`public`), '')) = 'N', 0, 1) AS `is_public`,
  COALESCE(NULLIF(`shoot`.`wr_datetime`, '0000-00-00 00:00:00'), CURRENT_TIMESTAMP) AS `created_at`,
  CURRENT_TIMESTAMP AS `updated_at`,
  JSON_OBJECT(
    'sourceDb', 'bnbuniv',
    'sourceTable', 'g5_write_new_shoot',
    'sourceId', `shoot`.`wr_id`,
    'rawFields', JSON_OBJECT(
      'wr1', `shoot`.`wr_1`,
      'wr2', `shoot`.`wr_2`,
      'wr3', `shoot`.`wr_3`,
      'wr4', `shoot`.`wr_4`,
      'wr5', `shoot`.`wr_5`,
      'wr6', `shoot`.`wr_6`,
      'wr7', `shoot`.`wr_7`,
      'wr8', `shoot`.`wr_8`,
      'wr9', `shoot`.`wr_9`,
      'wr10', `shoot`.`wr_10`
    ),
    'wrFile', NULLIF(TRIM(`shoot`.`wr_file`), ''),
    'wrHit', `shoot`.`wr_hit`,
    'wrParent', `shoot`.`wr_parent`,
    'wrNum', `shoot`.`wr_num`,
    'wrOption', NULLIF(TRIM(`shoot`.`wr_option`), ''),
    'links', JSON_OBJECT(
      'link1', NULLIF(TRIM(`shoot`.`wr_link1`), ''),
      'link2', NULLIF(TRIM(`shoot`.`wr_link2`), ''),
      'link1Hit', `shoot`.`wr_link1_hit`,
      'link2Hit', `shoot`.`wr_link2_hit`
    )
  ) AS `legacy_meta`
FROM `bnbuniv`.`g5_write_new_shoot` AS `shoot`
WHERE `shoot`.`wr_is_comment` = 0
  AND NULLIF(TRIM(`shoot`.`wr_subject`), '') IS NOT NULL
  AND NULLIF(TRIM(`shoot`.`wr_2`), '') IS NOT NULL
ORDER BY `shoot`.`wr_datetime` DESC, `shoot`.`wr_id` DESC;
