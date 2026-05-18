SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`highteen_special_classes`;

CREATE TABLE `bnb_legacy_work`.`highteen_special_classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body_html` longtext DEFAULT NULL,
  `youtube_url` varchar(255) DEFAULT NULL,
  `thumbnail_path` varchar(255) DEFAULT NULL,
  `gallery_images` longtext DEFAULT NULL CHECK (JSON_VALID(`gallery_images`)),
  `view_count` int(11) NOT NULL DEFAULT 0,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `published_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `highteen_special_classes_source_idx` (`source_db`, `source_table`, `source_id`),
  UNIQUE KEY `highteen_special_classes_slug_idx` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `bnb_legacy_work`.`highteen_special_classes` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `title`,
  `body_html`,
  `youtube_url`,
  `thumbnail_path`,
  `gallery_images`,
  `view_count`,
  `is_public`,
  `published_at`,
  `created_at`,
  `legacy_meta`
)
SELECT
  'bnbhighteen' AS `source_db`,
  'g5_write_new_specialclass' AS `source_table`,
  `special`.`wr_id` AS `source_id`,
  CONCAT('highteen-special-class-', `special`.`wr_id`) AS `slug`,
  NULLIF(TRIM(`special`.`wr_subject`), '') AS `title`,
  NULLIF(`special`.`wr_content`, '') AS `body_html`,
  CASE
    WHEN NULLIF(TRIM(`special`.`wr_2`), '') IS NULL THEN NULL
    ELSE CONCAT('https://www.youtube.com/watch?v=', TRIM(LEADING '/' FROM TRIM(`special`.`wr_2`)))
  END AS `youtube_url`,
  CASE
    WHEN NULLIF(TRIM(`thumbnail`.`bf_file`), '') IS NULL THEN NULL
    ELSE CONCAT('/legacy/highteen-special-classes/bnbhighteen/new_specialclass/', `special`.`wr_id`, '/thumbnail/', `thumbnail`.`bf_file`)
  END AS `thumbnail_path`,
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'sourceFile', COALESCE(NULLIF(TRIM(`files`.`bf_source`), ''), `files`.`bf_file`),
        'imagePath', CONCAT('/legacy/highteen-special-classes/bnbhighteen/new_specialclass/', `files`.`wr_id`, '/gallery/', `files`.`bf_file`),
        'displayOrder', `files`.`bf_no`
      )
    )
    FROM (
      SELECT `wr_id`, `bf_no`, `bf_source`, `bf_file`
      FROM `bnbhighteen`.`g5_board_file`
      WHERE `bo_table` = 'new_specialclass'
      ORDER BY `wr_id`, `bf_no`
    ) AS `files`
    WHERE `files`.`wr_id` = `special`.`wr_id`
  ) AS `gallery_images`,
  `special`.`wr_hit` AS `view_count`,
  CASE
    WHEN FIND_IN_SET('secret', `special`.`wr_option`) > 0 THEN 0
    ELSE 1
  END AS `is_public`,
  CASE
    WHEN `special`.`wr_datetime` = '0000-00-00 00:00:00' THEN CURRENT_TIMESTAMP
    ELSE `special`.`wr_datetime`
  END AS `published_at`,
  CASE
    WHEN `special`.`wr_datetime` = '0000-00-00 00:00:00' THEN CURRENT_TIMESTAMP
    ELSE `special`.`wr_datetime`
  END AS `created_at`,
  JSON_OBJECT(
    'rawFields',
    JSON_OBJECT(
      'wr1', `special`.`wr_1`,
      'wr2', `special`.`wr_2`,
      'wr3', `special`.`wr_3`,
      'wr4', `special`.`wr_4`,
      'wr5', `special`.`wr_5`,
      'wr6', `special`.`wr_6`,
      'wr7', `special`.`wr_7`,
      'wr8', `special`.`wr_8`,
      'wr9', `special`.`wr_9`,
      'wr10', `special`.`wr_10`
    ),
    'links',
    JSON_OBJECT(
      'wrLink1', `special`.`wr_link1`,
      'wrLink2', `special`.`wr_link2`
    ),
    'authorName',
    `special`.`wr_name`
  ) AS `legacy_meta`
FROM `bnbhighteen`.`g5_write_new_specialclass` AS `special`
LEFT JOIN `bnbhighteen`.`g5_board_file` AS `thumbnail`
  ON `thumbnail`.`bo_table` = 'new_specialclass'
  AND `thumbnail`.`wr_id` = `special`.`wr_id`
  AND `thumbnail`.`bf_no` = 0
WHERE `special`.`wr_is_comment` = 0
ORDER BY `special`.`wr_id`;
