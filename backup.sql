-- MySQL dump 10.13  Distrib 9.1.0, for Win64 (x86_64)
--
-- Host: localhost    Database: pr
-- ------------------------------------------------------
-- Server version	9.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_messages`
--

DROP TABLE IF EXISTS `ai_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `content` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_messages`
--

LOCK TABLES `ai_messages` WRITE;
/*!40000 ALTER TABLE `ai_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `size` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `order_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `cancellation_reason` text,
  `status` enum('pending','completed','processing','shipping','delivered','cancelled','received') DEFAULT 'pending',
  `order_code` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
INSERT INTO `cart` VALUES (26,6,14,1,'M','2025-03-20 21:16:06','2026-06-06 05:27:37','2025-03-20 21:16:06',NULL,'received','DH00000026'),(27,6,16,1,'L','2025-03-20 21:16:08','2026-06-06 05:27:37','2025-03-20 21:16:08','Không còn nhu cầu','received','DH00000027'),(28,6,18,1,'M','2025-03-20 21:16:10','2026-06-06 05:27:37','2025-03-20 21:16:10','Không còn nhu cầu','cancelled','DH00000028'),(29,6,17,1,'M','2025-03-20 21:16:12','2026-06-06 05:27:37','2025-03-20 21:16:12',NULL,'received','DH00000029'),(30,6,15,1,'M','2025-03-20 21:16:14','2026-06-06 05:27:37','2025-03-20 21:16:14',NULL,'received','DH00000030'),(31,6,33,1,'L','2025-03-21 08:13:41','2026-06-06 05:27:37','2025-03-21 08:13:41',NULL,'received','DH00000031'),(32,6,21,1,'M','2025-03-21 08:59:43','2026-06-06 05:27:37','2025-03-21 08:59:43',NULL,'completed','DH00000032'),(33,1,15,1,'M','2025-05-05 01:30:47','2026-06-06 05:27:37','2025-05-05 01:30:47',NULL,'pending','DH00000033'),(34,1,14,1,'M','2025-05-05 01:30:50','2026-06-06 05:27:37','2025-05-05 01:30:50',NULL,'received','DH00000034'),(35,1,15,1,'M','2025-05-26 19:47:29','2026-06-06 05:27:37','2025-05-26 19:47:29',NULL,'pending','DH00000035'),(36,6,24,1,'L','2025-05-28 02:59:48','2026-06-06 05:27:37','2025-05-28 02:59:48',NULL,'completed','DH00000036'),(37,6,16,1,'L','2025-06-17 20:32:00','2026-06-06 05:27:37','2025-06-17 20:32:00',NULL,'completed','DH00000037'),(38,8,21,1,'M','2025-06-19 22:38:28','2026-06-06 05:27:37','2025-06-19 22:38:28','Đặt nhầm sản phẩm','completed','DH00000038'),(39,8,24,1,'L','2025-06-19 22:38:31','2026-06-06 05:27:37','2025-06-19 22:38:31',NULL,'completed','DH00000039'),(40,1,25,1,'M','2025-06-25 22:16:54','2026-06-06 05:27:37','2025-06-25 22:16:54','Đặt nhầm sản phẩm','cancelled','DH00000040'),(41,10,16,1,'L','2025-06-26 19:13:56','2026-06-06 05:27:37','2025-06-26 19:13:56',NULL,'pending','DH00000041'),(42,10,14,1,'M','2025-06-26 19:14:52','2026-06-06 05:27:37','2025-06-26 19:14:52',NULL,'pending','DH00000042'),(43,10,14,1,'M','2025-06-26 19:14:58','2026-06-06 05:27:37','2025-06-26 19:14:58',NULL,'pending','DH00000043'),(44,10,14,1,'M','2025-06-26 19:17:39','2026-06-06 05:27:37','2025-06-26 19:17:39',NULL,'pending','DH00000044'),(45,1,17,1,'M','2025-06-26 19:54:28','2026-06-06 05:27:37','2025-06-26 19:54:28',NULL,'pending','DH00000045'),(47,6,20,1,'M','2025-07-03 17:41:36','2026-06-06 05:27:37','2025-07-03 17:41:36','Không còn nhu cầu','cancelled','DH00000047'),(48,8,14,1,'M','2025-07-08 23:09:02','2026-06-06 05:27:37','2025-07-08 23:09:02',NULL,'completed','DH00000048'),(49,8,49,1,'Không','2025-07-14 03:56:50','2026-06-06 05:27:37','2025-07-14 03:56:50',NULL,'completed','DH00000049'),(50,8,22,1,'M','2025-07-14 04:09:40','2026-06-06 05:27:37','2025-07-14 04:09:40',NULL,'received','DH00000050'),(51,8,58,1,'L','2025-07-14 19:04:52','2026-06-06 05:27:37','2025-07-14 19:04:52',NULL,'completed','DH00000051'),(52,8,15,1,'L','2025-08-23 15:16:33','2026-06-06 05:27:37','2025-08-23 15:16:33',NULL,'received','DH00000052'),(53,8,15,1,'L','2025-08-23 15:16:52','2026-06-06 05:27:37','2025-08-23 15:16:52',NULL,'received','DH00000053'),(54,8,15,1,'L','2025-08-23 15:19:17','2026-06-06 05:27:37','2025-08-23 15:19:17',NULL,'completed','DH00000054'),(55,8,20,1,'M','2025-08-23 16:08:01','2026-06-06 05:27:37','2025-08-23 16:08:01','Không còn nhu cầu','completed','DH00000055'),(56,8,60,1,'L','2025-08-23 16:08:55','2026-06-06 05:27:37','2025-08-23 16:08:55',NULL,'completed','DH00000056'),(57,1,14,1,'M','2025-11-26 14:17:48','2026-06-06 05:27:37','2025-11-26 14:17:48','Không còn nhu cầu','cancelled','DH00000057'),(58,8,43,2,'Không','2025-11-26 14:22:53','2026-06-06 05:27:37','2025-11-26 14:22:53',NULL,'completed','DH00000058'),(59,1,15,1,'L','2026-04-02 15:21:28','2026-06-06 05:27:37','2026-04-02 15:21:28',NULL,'pending','DH00000059'),(60,1,15,1,'L','2026-04-10 12:34:28','2026-06-06 05:27:37','2026-04-10 12:34:28',NULL,'pending','DH00000060'),(61,8,63,1,'L','2026-04-17 14:38:12','2026-06-06 05:27:37','2026-04-17 14:38:12',NULL,'completed','DH00000061'),(62,8,52,1,'L','2026-04-17 14:39:06','2026-06-06 05:27:37','2026-04-17 14:39:06',NULL,'completed','DH00000062'),(63,8,53,1,'L','2026-04-17 14:43:49','2026-06-06 05:27:37','2026-04-17 14:43:49',NULL,'completed','DH00000063'),(64,8,46,1,'Mini','2026-04-17 14:58:24','2026-06-06 05:27:37','2026-04-17 14:58:24',NULL,'completed','DH00000064'),(65,8,52,1,'L','2026-05-03 18:33:43','2026-06-06 05:27:37','2026-05-03 18:33:43',NULL,'completed','DH00000065'),(66,8,52,1,'L','2026-05-03 18:33:49','2026-06-06 05:27:37','2026-05-03 18:33:49',NULL,'received','DH00000066'),(67,8,53,1,'L','2026-05-03 18:34:10','2026-06-06 05:27:37','2026-05-03 18:34:10',NULL,'completed','DH00000067'),(68,8,53,1,'L','2026-05-03 18:34:12','2026-06-06 05:27:37','2026-05-03 18:34:12',NULL,'completed','DH00000068'),(69,8,28,1,'L','2026-05-14 13:25:11','2026-06-06 05:27:37','2026-05-14 13:25:11',NULL,'cancelled','DH00000069'),(70,8,28,1,'L','2026-05-14 13:25:15','2026-06-06 05:27:37','2026-05-14 13:25:15',NULL,'received','DH00000070'),(71,8,42,1,'Không có','2026-05-14 13:27:08','2026-06-06 05:27:37','2026-05-14 13:27:08',NULL,'cancelled','DH00000071'),(72,8,63,1,'L','2026-05-20 09:26:31','2026-06-06 05:27:37','2026-05-20 09:26:31',NULL,'completed','DH00000072'),(73,8,56,1,'L','2026-05-21 10:12:33','2026-06-06 05:27:37','2026-05-21 10:12:33',NULL,'cancelled','DH00000073'),(74,8,56,1,'L','2026-05-21 10:12:35','2026-06-06 05:27:37','2026-05-21 10:12:35',NULL,'received','DH00000074'),(75,8,54,1,'M','2026-05-27 14:39:47','2026-06-06 05:27:37','2026-05-27 14:39:47',NULL,'received','DH00000075'),(76,8,47,1,'Không','2026-05-27 15:03:21','2026-06-06 05:27:37','2026-05-27 15:03:21','Lý do khác','cancelled','DH00000076'),(77,8,57,1,'L','2026-05-27 15:28:14','2026-06-06 05:27:37','2026-05-27 15:28:14',NULL,'received','DH00000077'),(78,8,58,1,'L','2026-05-27 15:29:10','2026-06-06 05:27:37','2026-05-27 15:29:10',NULL,'received','DH00000078'),(79,8,17,1,'M','2026-05-29 18:02:04','2026-06-06 05:27:37','2026-05-29 18:02:04',NULL,'received','DH00000079'),(80,8,41,1,'Không có','2026-06-03 17:24:53','2026-06-06 05:27:37','2026-06-03 17:24:53',NULL,'received','DH00000080'),(81,8,44,1,'Không','2026-06-03 17:31:42','2026-06-06 05:27:37','2026-06-03 17:31:42',NULL,'cancelled','DH00000081'),(82,8,53,1,'L','2026-06-04 16:44:02','2026-06-06 05:27:37','2026-06-04 16:44:02',NULL,'received','DH00000082'),(83,8,43,1,'Không','2026-06-04 16:48:51','2026-06-06 05:27:37','2026-06-04 16:48:51',NULL,'received','DH00000083'),(84,8,55,1,'L','2026-06-04 16:54:16','2026-06-06 05:27:37','2026-06-04 16:54:16',NULL,'received','DH00000084'),(85,8,21,1,'S','2026-06-04 16:57:01','2026-06-06 05:27:37','2026-06-04 16:57:01',NULL,'received','DH00000085'),(86,8,61,1,'Không','2026-06-04 16:58:07','2026-06-06 05:27:37','2026-06-04 16:58:07',NULL,'completed','DH00000086'),(87,8,56,1,'L','2026-06-04 17:00:24','2026-06-06 05:27:37','2026-06-04 17:00:24',NULL,'received','DH00000087'),(88,8,56,1,'L','2026-06-04 17:05:44','2026-06-06 05:27:37','2026-06-04 17:05:44',NULL,'received','DH00000088'),(89,8,61,1,'Không','2026-06-04 17:23:44','2026-06-06 05:27:37','2026-06-04 17:23:44',NULL,'completed','DH00000089'),(90,8,20,1,'M','2026-06-04 17:27:26','2026-06-06 05:27:37','2026-06-04 17:27:26',NULL,'received','DH00000090'),(91,8,49,1,'Không','2026-06-04 17:30:36','2026-06-06 05:27:37','2026-06-04 17:30:36','Lý do khác','cancelled','DH00000091'),(92,8,47,1,'Không','2026-06-04 17:30:37','2026-06-06 05:27:37','2026-06-04 17:30:37',NULL,'received','DH00000092'),(93,8,62,1,'M','2026-06-04 17:41:35','2026-06-06 05:27:37','2026-06-04 17:41:35','Giao hàng chậm','cancelled','DH00000093'),(94,8,63,1,'L','2026-06-04 17:41:36','2026-06-06 05:27:37','2026-06-04 17:41:36',NULL,'completed','DH00000094'),(95,8,60,1,'L','2026-06-04 17:46:52','2026-06-06 05:27:37','2026-06-04 17:46:52',NULL,'completed','DH00000095'),(96,8,62,1,'M','2026-06-04 17:50:12','2026-06-06 05:27:37','2026-06-04 17:50:12',NULL,'completed','DH00000096'),(97,8,60,1,'L','2026-06-04 17:52:40','2026-06-06 05:27:37','2026-06-04 17:52:40',NULL,'received','DH00000097'),(98,8,59,1,'L','2026-06-04 17:54:05','2026-06-06 05:27:37','2026-06-04 17:54:05',NULL,'received','DH00000098'),(99,8,63,1,'L','2026-06-04 17:58:19','2026-06-06 05:27:37','2026-06-04 17:58:19',NULL,'completed','DH00000099'),(100,8,61,1,'Không','2026-06-04 17:59:12','2026-06-06 05:27:37','2026-06-04 17:59:12',NULL,'received','DH00000100'),(101,8,63,1,'L','2026-06-05 19:41:12','2026-06-06 05:27:37','2026-06-05 19:41:12',NULL,'completed','DH00000101'),(102,8,61,1,'Không','2026-06-05 19:56:09','2026-06-06 05:27:37','2026-06-05 19:56:09',NULL,'pending','DH00000102'),(103,8,59,1,'L','2026-06-05 19:56:16','2026-06-06 05:27:37','2026-06-05 19:56:16',NULL,'pending','DH00000103'),(104,8,63,1,'L','2026-06-05 19:56:22','2026-06-06 05:27:37','2026-06-05 19:56:22',NULL,'pending','DH00000104'),(105,8,56,1,'L','2026-06-05 19:57:38','2026-06-06 05:27:37','2026-06-05 19:57:38',NULL,'pending','DH00000105'),(106,8,54,1,'M','2026-06-05 19:58:09','2026-06-06 05:27:37','2026-06-05 19:58:09',NULL,'pending','DH00000106'),(107,8,61,1,'Không','2026-06-05 19:59:19','2026-06-06 05:27:37','2026-06-05 19:59:19',NULL,'pending','DH00000107'),(108,8,60,1,'L','2026-06-05 19:59:29','2026-06-06 05:27:37','2026-06-05 19:59:29',NULL,'pending','DH00000108'),(109,8,62,1,'M','2026-06-05 19:59:35','2026-06-06 05:27:37','2026-06-05 19:59:35',NULL,'pending','DH00000109'),(110,8,60,1,'L','2026-06-05 19:59:49','2026-06-06 05:27:37','2026-06-05 19:59:49',NULL,'pending','DH00000110'),(111,8,60,1,'L','2026-06-05 19:59:50','2026-06-06 05:27:37','2026-06-05 19:59:50',NULL,'pending','DH00000111'),(112,8,62,1,'M','2026-06-05 20:01:58','2026-06-06 05:27:37','2026-06-05 20:01:58',NULL,'pending','DH00000112'),(113,8,63,1,'L','2026-06-05 20:02:02','2026-06-06 05:27:37','2026-06-05 20:02:02',NULL,'pending','DH00000113'),(114,8,61,1,'Không','2026-06-05 20:02:08','2026-06-06 05:27:37','2026-06-05 20:02:08',NULL,'pending','DH00000114'),(115,8,22,1,'M','2026-06-05 20:03:19','2026-06-06 18:50:23','2026-06-05 20:03:19',NULL,'pending','DH00000115'),(116,8,63,1,'L','2026-06-05 20:10:01','2026-06-06 05:29:52','2026-06-05 20:10:01',NULL,'completed','DH00000116'),(117,8,62,1,'M','2026-06-05 20:10:03','2026-06-06 05:30:37','2026-06-05 20:10:03',NULL,'received','DH00000117'),(118,8,55,1,'L','2026-06-06 05:28:39','2026-06-06 05:30:37','2026-06-06 05:28:39',NULL,'received','DH00000117'),(119,8,54,1,'M','2026-06-06 05:28:40','2026-06-06 05:30:37','2026-06-06 05:28:40',NULL,'received','DH00000117'),(120,8,59,1,'L','2026-06-06 05:29:39','2026-06-06 05:29:52','2026-06-06 05:29:39',NULL,'completed','DH00000116');
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_settings`
--

DROP TABLE IF EXISTS `category_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hidden_categories` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_order` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_settings`
--

LOCK TABLES `category_settings` WRITE;
/*!40000 ALTER TABLE `category_settings` DISABLE KEYS */;
INSERT INTO `category_settings` VALUES (3,'[]','[]','2026-05-14 07:16:25');
/*!40000 ALTER TABLE `category_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `product_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (5,8,'Cuộc trò chuyện mới','2026-05-31 20:54:30',NULL),(29,8,'Cuộc trò chuyện mới','2026-05-31 21:33:49',NULL),(30,8,'Cuộc trò chuyện mới','2026-06-01 18:27:35',NULL),(31,8,'Cuộc trò chuyện mới','2026-06-01 18:27:35',NULL),(32,8,'Cuộc trò chuyện mới','2026-06-03 18:29:47',NULL),(33,8,'Cuộc trò chuyện mới','2026-06-03 18:29:47',NULL);
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_shifts`
--

DROP TABLE IF EXISTS `doctor_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_shifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `doctor_id` int NOT NULL,
  `shift_date` date NOT NULL,
  `shift_type` enum('morning','afternoon','night') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `doctor_shifts_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_shifts`
--

LOCK TABLES `doctor_shifts` WRITE;
/*!40000 ALTER TABLE `doctor_shifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `doctor_shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_favorite` (`user_id`,`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
INSERT INTO `favorites` VALUES (2,8,15),(4,8,22),(3,8,25),(7,8,50),(6,8,52),(5,8,62);
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `role` enum('user','assistant') DEFAULT NULL,
  `content` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,5,'user','hi bạn','2026-05-31 20:54:47'),(2,5,'assistant','Chào bạn, Tiệm Trà Happy xin chào! Mình có thể giúp gì cho bạn hôm nay ạ?','2026-05-31 20:54:47'),(3,5,'user','mình muốn od','2026-05-31 20:56:24'),(4,5,'assistant','Chào bạn, Tiệm Trà Happy rất vui được phục vụ! Bạn muốn gọi món gì ạ?','2026-05-31 20:56:24'),(15,30,'user','Tôi muốn được tư vấn về món Cà phê đen nóng. Giá của món này là 18000.00đ. Món này hương vị thế nào và có gì đặc biệt?','2026-06-01 18:27:37'),(16,30,'assistant','Chào bạn!\n\nMón **Cà phê đen nóng** có giá 18.000đ. Hương vị là cà phê đen nóng nguyên chất, rất thích hợp để thưởng thức sự đậm đà của cà phê.','2026-06-01 18:27:37'),(17,31,'user','Tôi muốn được tư vấn về món Cà phê đen nóng. Giá của món này là 18000.00đ. Món này hương vị thế nào và có gì đặc biệt?','2026-06-01 18:27:37'),(18,31,'assistant','Chào bạn!\n\nMón **Cà phê đen nóng** có giá 18.000đ. Món này mang hương vị cà phê đen nóng nguyên chất, rất thích hợp cho những ai yêu thích sự đậm đà và truyền thống của cà phê.','2026-06-01 18:27:37'),(19,31,'user','nó có ngon hông','2026-06-01 18:27:53'),(20,31,'assistant','Chào bạn!\nNếu bạn là người yêu thích hương vị cà phê đen nguyên chất, đậm đà và truyền thống, thì món Cà phê đen nóng chắc chắn sẽ rất ngon miệng và phù hợp với bạn đó!','2026-06-01 18:27:53'),(21,31,'user','mình muốn thanh toán','2026-06-01 18:29:16'),(22,31,'assistant','Chào bạn! Tiệm Trà Happy hiện có 2 phương thức thanh toán là:\n\n*   **Tiền mặt (cash)**\n*   **Chuyển khoản ngân hàng (banking)**\n\nBạn muốn thanh toán bằng hình thức nào ạ?','2026-06-01 18:29:16'),(23,32,'user','Tôi muốn được tư vấn về món Trà cam việt quất. Giá của món này là 45000.00đ. Món này hương vị thế nào và có gì đặc biệt?','2026-06-03 18:29:50'),(24,33,'user','Tôi muốn được tư vấn về món Trà cam việt quất. Giá của món này là 45000.00đ. Món này hương vị thế nào và có gì đặc biệt?','2026-06-03 18:29:50'),(25,32,'assistant','Chào bạn,\n\nMón Trà cam việt quất có giá 45.000đ và có hương vị chua đặc trưng, thanh mát ạ.','2026-06-03 18:29:50'),(26,33,'assistant','Chào bạn! Món **Trà cam việt quất** có giá 45.000đ. Món này mang vị chua thanh mát đặc trưng, là sự kết hợp tuyệt vời giữa cam và việt quất đó ạ.','2026-06-03 18:29:50');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,8,'🎁 Bạn vừa nhận được 1 voucher khuyến mãi từ Admin!',1,'2025-08-27 06:24:42'),(2,10,'🎁 Bạn vừa nhận được 1 voucher khuyến mãi từ Admin!',0,'2025-08-27 06:24:42'),(3,17,'🎁 Bạn vừa nhận được 1 voucher khuyến mãi từ Admin!',0,'2025-08-27 06:29:04'),(4,8,'🎁 Bạn vừa nhận được 1 voucher khuyến mãi từ Admin!',1,'2025-08-27 06:29:45'),(5,8,'🎁 Bạn vừa nhận được voucher khuyến mãi mới!',1,'2025-08-27 06:38:11'),(6,10,'🎁 Bạn vừa nhận được voucher khuyến mãi mới!',0,'2025-08-27 06:38:11'),(7,8,'🎁 Bạn vừa nhận được voucher khuyến mãi mới!',1,'2025-08-27 06:38:59'),(8,8,'🎁 Bạn vừa nhận được voucher khuyến mãi mới!',1,'2025-11-26 14:22:24'),(9,10,'🎁 Bạn vừa nhận được voucher khuyến mãi mới!',0,'2025-11-26 14:22:24'),(10,8,'🎁 Bạn vừa nhận được voucher khuyến mãi mới!',1,'2026-04-04 15:34:24'),(11,10,'🎁 Bạn vừa nhận được voucher khuyến mãi mới!',0,'2026-04-04 15:34:24'),(12,15,'🎁 Bạn vừa nhận được voucher khuyến mãi mới!',0,'2026-04-04 15:34:24'),(13,16,'🎁 Bạn vừa nhận được voucher sale57',0,'2026-04-08 15:57:24'),(14,8,'🎁 Bạn vừa nhận được voucher sale57',1,'2026-04-08 15:58:31'),(15,10,'🎁 Bạn vừa nhận được voucher sale57',0,'2026-04-08 15:58:31'),(16,15,'🎁 Bạn vừa nhận được voucher sale57',0,'2026-04-08 15:58:31'),(17,8,'Đơn hàng #77 đã giao thành công.',1,'2026-06-04 17:16:20'),(18,8,'Đơn hàng #78 đã giao thành công.',1,'2026-06-04 17:18:37'),(19,8,'Đơn hàng #76 đã giao thành công.',1,'2026-06-04 17:18:55'),(20,8,'Đơn hàng #75 đã giao thành công.',1,'2026-06-04 17:22:38'),(21,8,'Đơn hàng #74 đã giao thành công.',1,'2026-06-04 17:23:27'),(22,8,'Đơn hàng #119 trị giá 18.000đ đã được thanh toán thành công (Tiền mặt).',1,'2026-06-04 17:23:55'),(23,8,'Đơn hàng #89 đã giao thành công.',1,'2026-06-04 17:24:12'),(24,8,'Đơn hàng #86 đã giao thành công.',1,'2026-06-04 17:24:19'),(25,8,'Đơn hàng #73 đã bị hủy. Lý do: Không có lý do.',1,'2026-06-04 17:24:49'),(26,8,'Đơn hàng #71 đã bị hủy. Lý do: Không có lý do.',1,'2026-06-04 17:25:10'),(27,8,'Đơn hàng #120 trị giá 30.000đ đã được thanh toán thành công (Tiền mặt).',1,'2026-06-04 17:27:36'),(28,8,'Đơn hàng #90 đã giao thành công.',1,'2026-06-04 17:30:25'),(29,8,'Đơn hàng #121 trị giá 25.000đ đã được thanh toán thành công (Tiền mặt).',1,'2026-06-04 17:30:49'),(30,8,'Đơn hàng #122 trị giá 50.000đ đã được thanh toán thành công (Tiền mặt).',1,'2026-06-04 17:34:14'),(31,8,'Đơn hàng #91 của bạn đã bị hủy với lý do: Lý do khác.',1,'2026-06-04 17:39:46'),(32,8,'Đơn hàng #92 đã giao thành công.',1,'2026-06-04 17:40:03'),(33,8,'Đơn hàng #123 trị giá 35.000đ đã được thanh toán thành công (Tiền mặt).',1,'2026-06-04 17:41:45'),(34,8,'Đơn hàng #124 trị giá 45.000đ đã được tạo thành công (Chờ chuyển khoản).',1,'2026-06-04 17:42:47'),(35,8,'Đơn hàng #124 đã được thanh toán thành công.',1,'2026-06-04 17:43:08'),(36,8,'Đơn hàng #93 đã bị hủy. Lý do: Đặt nhầm sản phẩm.',1,'2026-06-04 17:43:35'),(37,8,'Đơn hàng #76 của bạn đã bị hủy với lý do: Lý do khác.',1,'2026-06-04 17:43:55'),(38,8,'Đơn hàng #94 đã giao thành công.',1,'2026-06-04 17:44:03'),(39,8,'Đơn hàng #125 trị giá 45.000đ đã được thanh toán thành công (Tiền mặt).',1,'2026-06-04 17:47:00'),(40,8,'Đơn hàng #126 trị giá 35.000đ đã được thanh toán thành công (Tiền mặt).',1,'2026-06-04 17:50:21'),(41,8,'Đơn hàng #93 của bạn đã bị hủy với lý do: Giao hàng chậm.',1,'2026-06-04 17:52:32'),(42,8,'Đơn hàng #127 trị giá 45.000đ đã được thanh toán thành công (Tiền mặt).',1,'2026-06-04 17:52:50'),(43,8,'Đơn hàng #128 trị giá 35.000đ đã được tạo thành công (Chờ chuyển khoản).',1,'2026-06-04 17:54:23'),(44,8,'Đơn hàng #128 đã được thanh toán thành công.',1,'2026-06-04 17:54:46'),(45,8,'Món Cacao đá kem muối trị giá 45.000đ đã được thanh toán thành công (Tiền mặt).',1,'2026-06-04 17:58:29'),(46,8,'Món Cà phê đen nóng trị giá 18.000đ đã được thanh toán thành công (Tiền mặt).',1,'2026-06-04 17:59:22'),(47,8,'Đơn hàng #100 đã giao thành công.',1,'2026-06-04 18:10:14'),(48,8,'Đơn hàng #99 đã giao thành công.',1,'2026-06-04 18:10:26'),(49,8,'Đơn hàng #98 đã giao thành công.',1,'2026-06-05 18:41:55'),(50,8,'Đơn hàng #97 đã giao thành công.',1,'2026-06-05 18:42:02'),(51,8,'Món Cacao đá kem muối trị giá 45.000đ đã được thanh toán thành công (Tiền mặt).',1,'2026-06-05 19:41:24'),(52,8,'Đơn hàng #DH00000117 (Cacao nóng, Trà sữa khoai môn, Trà sữa dâu) trị giá 88.000đ đã được thanh toán thành công (Tiền mặt).',1,'2026-06-06 05:29:09'),(53,8,'Đơn hàng #DH00000116 (Cacao đá kem muối, Trà nho) trị giá 80.000đ đã được thanh toán thành công (Tiền mặt).',1,'2026-06-06 05:29:52'),(54,8,'Đơn hàng #DH00000117 đã giao thành công.',1,'2026-06-06 05:30:37');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
INSERT INTO `password_resets` VALUES (19,'tuananh02@gmail.com','419832','2026-06-04 00:17:22','2026-06-03 17:12:21'),(20,'huynhnguyentuananh11@gmail.com','669696','2026-06-04 00:18:16','2026-06-03 17:13:16'),(21,'huynhnguyentuananh0511@gmail.com','666545','2026-06-04 00:18:39','2026-06-03 17:13:38');
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `phone` varchar(20) NOT NULL,
  `payment_method` enum('cash','banking') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `order_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `payment_status` enum('pending','confirmed','paid','expired','failed') DEFAULT 'pending',
  `transaction_code` varchar(255) DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (16,6,14,'tuấn anh','68 nguyễn văn yến, tân phú, tp.hồ chí minh','0354780511','cash',25000.00,'2025-03-20 21:17:16','2025-07-04 00:45:06','pending',NULL,NULL),(17,6,16,'Anh Huỳnh','68 nvy','0354780511','banking',35000.00,'2025-03-20 21:17:34','2025-07-04 00:45:06','pending',NULL,NULL),(18,6,17,'Anh Huỳnh','68 nvy','0354780511','cash',25000.00,'2025-03-20 21:18:00','2025-07-04 00:45:06','pending',NULL,NULL),(66,8,21,'akashi','Dinh Độc Lập, 135, Nam Kỳ Khởi Nghĩa, Sài Gòn, Phường Bến Thành, Thành phố Hồ Chí Minh, 71006, Việt Nam','0256689521','cash',20000.00,'2025-06-19 22:39:10','2025-07-04 00:45:06','pending',NULL,NULL),(68,6,33,'Anh Huỳnh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',30000.00,'2025-07-02 05:18:55','2025-07-04 00:45:06','pending',NULL,NULL),(69,6,20,'tuấn anh','Phường Phú Thọ, Thành phố Hồ Chí Minh, 72000, Việt Nam','0354780511','cash',30000.00,'2025-07-03 17:42:08','2025-07-04 00:45:06','pending',NULL,NULL),(70,8,24,'tuấn anh','Hẻm 95/77 Lê Văn Lương, Quận 7, Thành phố Hồ Chí Minh, 72911, Việt Nam','0354780511','cash',40000.00,'2025-07-09 05:11:40','2025-07-09 12:11:40','pending',NULL,NULL),(71,8,22,'anh ','Hẻm 46 Thuận Kiều, Phường Minh Phụng, Thành phố Hồ Chí Minh, 72415, Việt Nam','0354780511','cash',20000.00,'2025-07-14 04:10:41','2025-07-14 11:10:41','pending',NULL,NULL),(72,8,58,'john','Tam Hostel, Hẻm 65 Thủ Khoa Huân, Khu phố 7, Phường Bến Thành, Thành phố Hồ Chí Minh, Sài Gòn, 71009, Việt Nam','0354780511','cash',30000.00,'2025-07-14 19:06:10','2025-07-15 02:06:10','pending',NULL,NULL),(73,8,14,'Huỳnh Nguyễn Tuấn Minh','PHỞ SOL - Q1 (Phở & Các Món Ngon Từ Phở) Phở Thìn - By SOL, 27, Hải Triều, Khu phố 1, Phường Sài Gòn, Thành phố Thủ Đức, Thành phố Hồ Chí Minh, 00084, Việt Nam','0354780511','banking',25000.00,'2025-08-23 14:19:47','2025-08-23 21:19:47','pending',NULL,NULL),(74,8,14,'Huỳnh Nguyễn Tuấn Minh','PHỞ SOL - Q1 (Phở & Các Món Ngon Từ Phở) Phở Thìn - By SOL, 27, Hải Triều, Khu phố 1, Phường Sài Gòn, Thành phố Thủ Đức, Thành phố Hồ Chí Minh, 00084, Việt Nam','0354780511','banking',25000.00,'2025-08-23 14:19:57','2025-08-23 21:19:57','pending',NULL,NULL),(75,8,49,'tuấn anh','Nguyễn Văn Cừ, Cầu Ông Lãnh, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh, 72760, Việt Nam','0354780511','cash',50000.00,'2025-08-23 15:46:03','2025-08-23 22:46:03','pending',NULL,NULL),(76,8,15,'tuấn anh','68 Nguyễn Văn Yến','0354780511','cash',20500.00,'2025-08-23 15:58:56','2025-08-23 22:58:56','pending',NULL,NULL),(77,8,20,'tuấn anh','68 Nguyễn Văn Yến','0354780511','cash',30000.00,'2025-08-23 16:08:35','2025-08-23 23:08:35','pending',NULL,NULL),(78,8,43,'tuấn anh','PHỞ SOL - Q1 (Phở & Các Món Ngon Từ Phở) Phở Thìn - By SOL, 27, Hải Triều, Khu phố 1, Phường Sài Gòn, Thành phố Thủ Đức, Thành phố Hồ Chí Minh, 00084, Việt Nam','0223568871','cash',56000.00,'2025-11-26 14:23:59','2025-11-26 21:23:59','pending',NULL,NULL),(79,8,60,'tuấn anh','Hẻm 237 Trịnh Đình Trọng, Khu phố 29, Phường Tân Phú, Thành phố Hồ Chí Minh, 72000, Việt Nam','0354780511','cash',36000.00,'2026-04-04 15:50:59','2026-04-04 22:50:59','pending',NULL,NULL),(80,8,63,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',45000.00,'2026-04-17 14:38:38','2026-04-17 21:38:38','pending',NULL,NULL),(81,8,63,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',45000.00,'2026-04-17 14:38:43','2026-04-17 21:38:43','pending',NULL,NULL),(82,8,52,'tuấn anh','Nguyễn Văn Cừ, Cầu Ông Lãnh, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh, 72760, Việt Nam','0223568871','cash',35000.00,'2026-04-17 14:39:28','2026-04-17 21:39:28','pending',NULL,NULL),(83,8,53,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',50000.00,'2026-04-17 14:44:14','2026-04-17 21:44:14','pending',NULL,NULL),(84,8,46,'anh','68 Nguyễn Văn Yến','0354780511','banking',19000.00,'2026-04-17 15:04:43','2026-04-17 22:04:43','pending',NULL,NULL),(85,8,52,'anh','PHỞ SOL - Q1 (Phở & Các Món Ngon Từ Phở) Phở Thìn - By SOL, 27, Hải Triều, Khu phố 1, Phường Sài Gòn, Thành phố Thủ Đức, Thành phố Hồ Chí Minh, 00084, Việt Nam','0354780511','banking',35000.00,'2026-05-03 18:35:16','2026-05-04 01:35:16','pending',NULL,NULL),(86,8,28,'tuấn anh','Nguyễn Văn Cừ, Cầu Ông Lãnh, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh, 72760, Việt Nam','0354780511','banking',30000.00,'2026-05-14 13:26:11','2026-05-14 20:26:11','pending',NULL,NULL),(87,8,42,'tuấn anh','Nguyễn Văn Cừ, Cầu Ông Lãnh, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh, 72760, Việt Nam','0354780511','banking',28000.00,'2026-05-18 15:13:15','2026-05-18 22:13:15','pending','DH1779117195756',NULL),(88,8,42,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',28000.00,'2026-05-18 15:23:38','2026-05-18 22:23:38','pending','DH1779117818453',NULL),(89,8,42,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',28000.00,'2026-05-18 15:37:15','2026-05-18 22:37:15','pending','DH1779118635665',NULL),(90,8,42,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',28000.00,'2026-05-18 15:37:43','2026-05-18 22:37:43','pending','DH1779118663450',NULL),(91,8,42,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',28000.00,'2026-05-19 09:39:33','2026-05-19 16:39:33','paid','DH1779183573480','2026-05-19 09:42:34'),(92,8,42,'trà kiwi','68 Nguyễn Văn Yến','0354780511','banking',28000.00,'2026-05-19 18:32:58','2026-05-20 01:32:58','paid','DH1779215578921','2026-05-19 18:35:30'),(93,8,63,'tuấn anh','PHỞ SOL - Q1 (Phở & Các Món Ngon Từ Phở) Phở Thìn - By SOL, 27, Hải Triều, Khu phố 1, Phường Sài Gòn, Thành phố Thủ Đức, Thành phố Hồ Chí Minh, 00084, Việt Nam','0354780511','banking',45000.00,'2026-05-21 06:09:22','2026-05-21 13:09:22','paid','DH1779343762509','2026-05-21 06:24:43'),(94,8,63,'anh','68 Nguyễn Văn Yến','0354780511','banking',45000.00,'2026-05-21 06:24:01','2026-05-21 13:24:01','paid','DH1779344641283','2026-05-21 06:28:56'),(95,8,53,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',50000.00,'2026-05-21 06:32:59','2026-05-21 13:32:59','pending','DH1779345179681',NULL),(96,8,53,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',50000.00,'2026-05-21 06:34:56','2026-05-21 13:34:56','pending','DH1779345296818',NULL),(97,8,53,'anh','68 Nguyễn Văn Yến','0354780511','banking',50000.00,'2026-05-21 06:50:01','2026-05-21 13:50:01','pending','DH1779346201166',NULL),(98,8,53,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',50000.00,'2026-05-21 07:51:09','2026-05-21 14:51:09','paid','DH1779349869991','2026-05-21 07:52:20'),(99,8,56,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',39000.00,'2026-05-21 10:12:57','2026-05-21 17:12:57','paid','DH1779358377955','2026-05-21 10:14:00'),(100,8,54,'tuấn anh','PHỞ SOL - Q1 (Phở & Các Món Ngon Từ Phở) Phở Thìn - By SOL, 27, Hải Triều, Khu phố 1, Phường Sài Gòn, Thành phố Thủ Đức, Thành phố Hồ Chí Minh, 00084, Việt Nam','0354780511','banking',25000.00,'2026-05-27 14:40:23','2026-05-27 21:40:23','pending','DH1779892823670',NULL),(101,8,54,'tuấn anh','PHỞ SOL - Q1 (Phở & Các Món Ngon Từ Phở) Phở Thìn - By SOL, 27, Hải Triều, Khu phố 1, Phường Sài Gòn, Thành phố Thủ Đức, Thành phố Hồ Chí Minh, 00084, Việt Nam','0354780511','banking',25000.00,'2026-05-27 14:40:27','2026-05-27 21:40:27','pending','DH1779892827774',NULL),(102,8,54,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',25000.00,'2026-05-27 14:40:45','2026-05-27 21:40:45','pending','DH1779892845367',NULL),(103,8,54,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',25000.00,'2026-05-27 14:41:12','2026-05-27 21:41:12','pending','DH1779892872398',NULL),(104,8,54,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',25000.00,'2026-05-27 14:43:28','2026-05-27 21:43:28','pending','DH1779893008296',NULL),(105,8,54,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',25000.00,'2026-05-27 14:55:50','2026-05-27 21:55:50','paid','DH1779893750156','2026-05-27 15:02:59'),(106,8,47,'tuấn anh','PHỞ SOL - Q1 (Phở & Các Món Ngon Từ Phở) Phở Thìn - By SOL, 27, Hải Triều, Khu phố 1, Phường Sài Gòn, Thành phố Thủ Đức, Thành phố Hồ Chí Minh, 00084, Việt Nam','0354780511','banking',25000.00,'2026-05-27 15:03:48','2026-05-27 22:03:48','paid','DH1779894228162','2026-05-27 15:04:09'),(107,8,57,'tuấn anh','68 Nguyễn Văn Yến','0354780511','banking',45000.00,'2026-05-27 15:28:33','2026-05-27 22:28:33','paid','DH1779895713455','2026-05-27 15:28:59'),(108,8,58,'tuấn anh','Nguyễn Văn Cừ, Cầu Ông Lãnh, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh, 72760, Việt Nam','0354780511','cash',30000.00,'2026-05-27 15:29:26','2026-05-27 22:29:26','paid',NULL,NULL),(109,8,17,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','banking',25000.00,'2026-05-29 18:02:58','2026-05-30 01:02:58','paid','DH1780077778660','2026-05-29 18:03:57'),(110,8,41,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','banking',18000.00,'2026-06-03 17:25:04','2026-06-04 00:25:04','paid','DH1780507504980','2026-06-03 17:34:05'),(111,8,44,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','banking',29000.00,'2026-06-03 17:36:51','2026-06-04 00:36:51','paid','DH1780508211992','2026-06-03 17:37:16'),(112,8,53,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','banking',50000.00,'2026-06-04 16:44:25','2026-06-04 23:44:25','paid','DH1780591465960','2026-06-04 16:45:00'),(113,8,43,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',35000.00,'2026-06-04 16:49:08','2026-06-04 23:49:08','paid',NULL,NULL),(114,8,55,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','banking',28000.00,'2026-06-04 16:54:29','2026-06-04 23:54:29','paid','DH1780592069364','2026-06-04 16:54:53'),(115,8,21,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',20000.00,'2026-06-04 16:57:21','2026-06-04 23:57:21','paid',NULL,NULL),(116,8,61,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',18000.00,'2026-06-04 16:58:25','2026-06-04 23:58:25','paid',NULL,NULL),(117,8,56,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','banking',39000.00,'2026-06-04 17:00:36','2026-06-05 00:00:36','paid','DH1780592436261','2026-06-04 17:00:57'),(118,8,56,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','banking',39000.00,'2026-06-04 17:06:00','2026-06-05 00:06:00','paid','DH1780592760877','2026-06-04 17:06:31'),(119,8,61,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',18000.00,'2026-06-04 17:23:55','2026-06-05 00:23:55','paid',NULL,NULL),(120,8,20,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',30000.00,'2026-06-04 17:27:36','2026-06-05 00:27:36','paid',NULL,NULL),(121,8,47,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',25000.00,'2026-06-04 17:30:49','2026-06-05 00:30:49','paid',NULL,NULL),(122,8,49,'Anh Huỳnh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',50000.00,'2026-06-04 17:34:14','2026-06-05 00:34:14','paid',NULL,NULL),(123,8,62,'Anh Huỳnh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',35000.00,'2026-06-04 17:41:45','2026-06-05 00:41:45','paid',NULL,NULL),(124,8,63,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','banking',45000.00,'2026-06-04 17:42:47','2026-06-05 00:42:47','paid','DH1780594967605','2026-06-04 17:43:08'),(125,8,60,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',45000.00,'2026-06-04 17:47:00','2026-06-05 00:47:00','paid',NULL,NULL),(126,8,62,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',35000.00,'2026-06-04 17:50:21','2026-06-05 00:50:21','paid',NULL,NULL),(127,8,60,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',45000.00,'2026-06-04 17:52:50','2026-06-05 00:52:50','paid',NULL,NULL),(128,8,59,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','banking',35000.00,'2026-06-04 17:54:23','2026-06-05 00:54:23','paid','DH1780595663666','2026-06-04 17:54:46'),(129,8,63,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',45000.00,'2026-06-04 17:58:29','2026-06-05 00:58:29','paid',NULL,NULL),(130,8,61,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',18000.00,'2026-06-04 17:59:22','2026-06-05 00:59:22','paid',NULL,NULL),(131,8,63,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',45000.00,'2026-06-05 19:41:23','2026-06-06 02:41:23','paid',NULL,NULL),(132,8,62,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',88000.00,'2026-06-06 05:29:09','2026-06-06 12:29:09','paid','DH00000117',NULL),(133,8,63,'Huỳnh Nguyễn Tuấn Anh','100a/4 Nguyễn Xuân Khoát','0354780511','cash',80000.00,'2026-06-06 05:29:52','2026-06-06 12:29:52','paid','DH00000116',NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_edit_logs`
--

DROP TABLE IF EXISTS `product_edit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_edit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `edited_by` varchar(100) DEFAULT NULL,
  `edit_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `changed_fields` text,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_edit_logs_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_edit_logs`
--

LOCK TABLES `product_edit_logs` WRITE;
/*!40000 ALTER TABLE `product_edit_logs` DISABLE KEYS */;
INSERT INTO `product_edit_logs` VALUES (1,27,'admin','2025-06-27 03:09:46','{\"size\":{\"from\":\"L\",\"to\":\"M\"}}'),(2,16,'admin','2025-06-27 03:14:16','{\"size\":{\"from\":\"L\",\"to\":\"M\"}}'),(3,15,'admin','2025-07-05 22:46:26','{\"code\":{\"from\":\"A_002\",\"to\":\"A_009\"}}'),(4,21,'admin','2025-07-07 10:05:13','{\"size\":{\"from\":\"M\",\"to\":\"S\"}}'),(5,21,NULL,'2025-07-07 10:09:11','{\"size\":{\"from\":\"S\",\"to\":\"M\"}}'),(6,21,'unknown','2025-07-07 10:12:52','{\"size\":{\"from\":\"M\",\"to\":\"S\"}}'),(7,21,'staff','2025-07-07 10:21:32','{}'),(8,36,'staff','2025-07-07 12:48:10','{\"image\":{\"from\":\"a.png \",\"to\":\"https://img.lovepik.com/original_origin_pic/18/09/18/2d86ad56c3d6096ef86eeb8c60cc02ef.png_wh300.png\"}}'),(9,37,'staff','2025-07-07 12:52:10','{\"price\":{\"from\":\"20.00\",\"to\":\"15.000\"}}'),(10,37,'staff','2025-07-07 12:52:23','{\"price\":{\"from\":\"15.00\",\"to\":\"15.000\"}}'),(11,36,'staff','2025-07-07 12:52:50','{\"price\":{\"from\":\"35.00\",\"to\":\"35.000\"}}'),(12,36,'staff','2025-07-07 12:53:05','{\"size\":{\"from\":\"L\",\"to\":\"M\"}}'),(13,36,'staff','2025-07-07 12:54:09','{\"price\":{\"from\":\"35.00\",\"to\":\"30.000\"}}'),(14,36,'staff','2025-07-07 12:54:28','{\"price\":{\"from\":\"30.00\",\"to\":\"30.000\"}}'),(15,37,'staff','2025-07-07 12:58:37','{\"price\":{\"from\":\"15.00\",\"to\":\"15.000\"}}'),(16,37,'staff','2025-07-07 13:02:00','{\"price\":{\"from\":\"15.00\",\"to\":\"15.000\"}}'),(17,37,'staff','2025-07-07 13:02:13','{\"price\":{\"from\":\"15.00\",\"to\":\"15.000\"}}'),(18,37,'staff','2025-07-07 13:03:36','{\"price\":{\"from\":\"15.00\",\"to\":\"15000\"}}'),(19,36,'staff','2025-07-07 13:03:51','{\"price\":{\"from\":\"30.00\",\"to\":\"30000\"}}'),(20,52,'staff','2025-07-08 01:59:15','{\"name\":{\"from\":\"Sinh tố xoài\",\"to\":\"Sinh tố matcha\"},\"description\":{\"from\":\"Vị chua của xoài\",\"to\":\"Vị hơi đắng nhẹ của matcha nhật\"},\"image\":{\"from\":\"https://img.lovepik.com/free-png/20220120/lovepik-hand-drawn-mango-smoothie-png-image_401531101_wh300.png\",\"to\":\"https://img.lovepik.com/free-png/20220118/lovepik-matcha-smoothie-png-image_401452703_wh300.png\"}}'),(21,18,'staff','2025-08-12 20:31:07','{}'),(22,14,'staff','2025-08-23 21:24:01','{\"description\":{\"from\":\"chua, mát lạnh\\n\",\"to\":\"chua, mát lạnh, đậm trà\\n\\n\"}}'),(23,44,'staff','2026-05-10 02:41:39','{}'),(24,50,'staff','2026-05-10 02:43:55','{}'),(25,50,'staff','2026-05-13 01:37:05','{\"image\":{\"from\":\"https://img.lovepik.com/png/20231027/Watercolor-dessert-fruit-raspberry-blueberry-food-macaron-cookie-organic-green_380787_wh300.png\",\"to\":\"https://png.pngtree.com/png-vector/20241106/ourlarge/pngtree-colorful-assortment-of-macarons-png-image_14202308.png\"}}'),(26,49,'staff','2026-05-13 01:41:40','{\"image\":{\"from\":\"https://img.lovepik.com/free_png/32/41/95/37058PICjzBcnX9HTaa45_PIC2018.png_300.png\",\"to\":\"https://vi.pngtree.com/freepng/a-piece-of-strawberry-cream-cake_9143142.html\"}}'),(27,49,'staff','2026-05-13 01:42:33','{\"image\":{\"from\":\"https://vi.pngtree.com/freepng/a-piece-of-strawberry-cream-cake_9143142.html\",\"to\":\"https://www.bing.com/th/id/OIP.zNAJ96IA92RUNCkwoSPcjAHaHa?w=193&h=193&c=8&rs=1&qlt=90&o=6&pid=3.1&rm=2\"}}'),(28,39,'staff','2026-05-13 01:49:39','{\"image\":{\"from\":\"https://img.lovepik.com/free-png/20220516/lovepik-pink-c4d-three-dimensional-food-donut-png-image_402164519_wh300.png\",\"to\":\"https://img.lovepik.com/png/20231105/Donut-Chocolate-Black-vector-snacks-Doughnut-clip-delicious-donut_496788_wh860.png\"}}'),(29,39,'staff','2026-05-13 01:50:36','{\"image\":{\"from\":\"https://img.lovepik.com/png/20231105/Donut-Chocolate-Black-vector-snacks-Doughnut-clip-delicious-donut_496788_wh860.png\",\"to\":\"https://thf.bing.com/th/id/OIP.z38b8YiXC0Xrl8HjtWFEPwHaHa?w=183&h=183&c=7&r=0&o=7&cb=thfc1&pid=1.7&rm=3\"}}'),(30,40,'staff','2026-05-13 01:52:04','{\"image\":{\"from\":\"https://img.lovepik.com/element/40219/3024.png_300.png\",\"to\":\"https://www.hoidaubepaau.com/wp-content/uploads/2015/12/hinh-anh-banh-donut.jpg\"}}'),(31,40,'staff','2026-05-13 01:52:51','{\"image\":{\"from\":\"https://www.hoidaubepaau.com/wp-content/uploads/2015/12/hinh-anh-banh-donut.jpg\",\"to\":\"https://tse2.mm.bing.net/th/id/OIP.L3ZjGExxX8I8-rao5wEhbgHaGB?cb=thfc1&pid=ImgDet&w=199&h=161&c=7&o=7&rm=3\"}}'),(32,44,'staff','2026-05-13 01:53:45','{\"image\":{\"from\":\"https://img.lovepik.com/original_origin_pic/18/09/12/60b95cc3cdfa61516e65d7a738219999.png_wh300.png\",\"to\":\"https://thf.bing.com/th/id/OIP.wDWaPCNpUnsCeiXc2JqA3QHaE8?w=261&h=180&c=7&r=0&o=7&cb=thfc1&pid=1.7&rm=3\"}}'),(33,48,'staff','2026-05-13 01:55:00','{\"image\":{\"from\":\"https://img.lovepik.com/png/20231028/Bread-food-planet-Food-planet-space-To-toast-bread_394644_wh300.png\",\"to\":\"https://tse4.mm.bing.net/th/id/OIP.KWMrMw24H-U1qhpfO5cG1wAAAA?cb=thfc1&pid=ImgDet&w=199&h=199&c=7&o=7&rm=3\"}}'),(34,41,'staff','2026-05-13 01:55:23','{\"image\":{\"from\":\"https://img.lovepik.com/free-png/20211231/lovepik-egg-tart-dessert-food-gourmet-pastry-lovely-png-image_401106380_wh300.png\",\"to\":\"https://tse4.mm.bing.net/th/id/OIP.f2FdbhuXtFunvEArJiXk2QAAAA?cb=thfc1&pid=ImgDet&w=199&h=199&c=7&o=7&rm=3\"}}'),(35,45,'staff','2026-05-13 02:00:47','{\"image\":{\"from\":\"https://img.lovepik.com/png/20231106/food-red-strawberry-scones-dessert-blueberry-fluffy_506497_wh300.png\",\"to\":\"https://thf.bing.com/th/id/OIP.T2YQZeIxYvesX8AiDsO5TQHaHa?w=184&h=184&c=7&r=0&o=7&cb=thfc1&pid=1.7&rm=3\"}}'),(36,42,'staff','2026-05-13 02:02:00','{\"image\":{\"from\":\"https://img.lovepik.com/original_origin_pic/18/06/05/f755f08f24ce79fea62035cec28bbb7d.png_wh300.png\",\"to\":\"https://thf.bing.com/th/id/OIP.26nhwT0FBmPtVQD1MJ1eqAHaFW?w=238&h=184&c=7&r=0&o=7&cb=thfc1&pid=1.7&rm=3\"}}'),(37,37,'staff','2026-05-13 02:02:39','{\"image\":{\"from\":\"https://img.lovepik.com/original_origin_pic/18/12/27/fc99b70ecb5f8fbd9d71251b74964e5d.png_wh300.png\",\"to\":\"https://www.bing.com/th/id/OIP.PKHQXGHauhOZt5Lz3H9DvwHaHa?w=193&h=193&c=8&rs=1&qlt=90&o=6&pid=3.1&rm=2\"}}'),(38,42,'staff','2026-05-13 02:03:13','{\"image\":{\"from\":\"https://thf.bing.com/th/id/OIP.26nhwT0FBmPtVQD1MJ1eqAHaFW?w=238&h=184&c=7&r=0&o=7&cb=thfc1&pid=1.7&rm=3\",\"to\":\"https://thf.bing.com/th/id/OIP.OwiasKJl8CMxeNws8kzSYgHaHa?w=184&h=184&c=7&r=0&o=7&cb=thfc1&pid=1.7&rm=3\"}}'),(39,47,'staff','2026-05-13 02:06:06','{\"image\":{\"from\":\"https://img.lovepik.com/original_origin_pic/18/09/22/69a69673cdd5fd9cb5f5152bb2924ae9.png_wh300.png\",\"to\":\"https://thf.bing.com/th/id/OIP.vNhIJYtMhTPmQf7Pl4-ZhgHaHa?w=192&h=195&c=7&r=0&o=7&cb=thfc1&pid=1.7&rm=3\"}}'),(40,50,'staff','2026-05-13 02:06:44','{\"image\":{\"from\":\"https://png.pngtree.com/png-vector/20241106/ourlarge/pngtree-colorful-assortment-of-macarons-png-image_14202308.png\",\"to\":\"https://tse1.mm.bing.net/th/id/OIP.7k-a9LNc4QDjZMOOo_oRVgHaHa?cb=thfc1&pid=ImgDet&w=199&h=199&c=7&o=7&rm=3\"}}'),(41,44,'staff','2026-05-13 02:09:09','{\"image\":{\"from\":\"https://thf.bing.com/th/id/OIP.wDWaPCNpUnsCeiXc2JqA3QHaE8?w=261&h=180&c=7&r=0&o=7&cb=thfc1&pid=1.7&rm=3\",\"to\":\"https://tse4.mm.bing.net/th/id/OIP.MQ8Cu9_R4zPy1-twFaP_6gAAAA?cb=thfc1&pid=ImgDet&w=199&h=199&c=7&o=7&rm=3\"}}'),(42,38,'staff','2026-05-13 02:10:13','{\"image\":{\"from\":\"https://img.lovepik.com/original_origin_pic/18/11/13/7f5817defbe9a3a0a60ac6a2bf7de8c4.png_wh300.png\",\"to\":\"https://tse4.mm.bing.net/th/id/OIP.V3HFwz4DAbnX8WN2KULbZAHaHa?cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3\"}}'),(43,36,'staff','2026-05-13 02:12:29','{\"image\":{\"from\":\"https://img.lovepik.com/original_origin_pic/18/09/18/2d86ad56c3d6096ef86eeb8c60cc02ef.png_wh300.png\",\"to\":\"https://tse3.mm.bing.net/th/id/OIP.s0HPL08jqkIGu2CF1VtADgAAAA?cb=thfc1&pid=ImgDet&w=199&h=199&c=7&o=7&rm=3\"}}'),(44,14,'staff','2026-05-13 02:34:30','{\"is_available\":{\"from\":1,\"to\":0}}'),(45,14,'staff','2026-05-13 02:59:48','{\"is_available\":{\"from\":0,\"to\":1}}'),(46,58,'staff','2026-05-23 01:57:01','{}'),(47,62,'staff','2026-05-27 22:57:50','{\"image\":{\"from\":\"https://img.lovepik.com/png/20231017/Christmas-red-christmas-tree-cup-of-hot-cocoa-cotton-candy_238422_wh300.png\",\"to\":\"https://images.pexels.com/photos/10303534/pexels-photo-10303534.jpeg?auto=compress&cs=tinysrgb&h=650&w=940\"}}'),(48,60,'staff','2026-05-27 23:00:11','{\"image\":{\"from\":\"https://img.lovepik.com/png/20231024/Orange-blueberry-fruit-wave-tea-summer-orange-bobo-tea-ice_336274_wh300.png\",\"to\":\"https://images.pexels.com/photos/26951896/pexels-photo-26951896.jpeg?auto=compress&cs=tinysrgb&h=650&w=940\"}}'),(49,43,'staff','2026-05-27 23:01:45','{\"image\":{\"from\":\"https://img.lovepik.com/original_origin_pic/18/06/05/7ccc13f7e3b427f7bc0c67fd56c44b9a.png_wh300.png\",\"to\":\"https://images.pexels.com/photos/37418888/pexels-photo-37418888.jpeg?auto=compress&cs=tinysrgb&h=650&w=940\"}}'),(50,43,'staff','2026-05-27 23:11:15','{}'),(51,61,'staff','2026-05-30 00:35:39','{\"description\":{\"from\":\"Vừa đắng vừa ngọt\",\"to\":\"Cà phê đen nóng \"},\"image\":{\"from\":\"https://img.lovepik.com/free-png/20211225/lovepik-a-cup-of-coffee-png-image_400326431_wh300.png\",\"to\":\"https://images.pexels.com/photos/14111068/pexels-photo-14111068.jpeg?auto=compress&cs=tinysrgb&h=650&w=940\"}}');
/*!40000 ALTER TABLE `product_edit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image` varchar(255) DEFAULT NULL,
  `code` varchar(50) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `description` text,
  `size` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (14,'/image/1.png','A_001','sinh tố xoài',25000.00,'chua, mát lạnh, đậm trà\n\n','M','sinh tố',1),(15,'/image/2.png','A_009','sinh tố dâu ',20500.00,'mát lạnh, ngọt','L','sinh tố',1),(16,'/image/3.png','A_003','sinh tố trái cây',35000.00,'nhiều loại trái cây hòa quyện','M','sinh tố',1),(17,'/image/4.png','A_004','sinh tố dưa hấu',25000.00,'dưa hấu mát lạnh','M','sinh tố',1),(18,'/image/5.png','A_005','sinh tố đá bào cherry',30000.00,'cherry ngọt cùng với đá bào mát lạnh','M','sinh tố',1),(19,'/image/6.png','A_006','sinh tố việt quất',25000.00,'việt quất ngọt nước','M','sinh tố',1),(20,'/image/7.png','B_001','capuchino',30000.00,'capuchino hòa quyện ','M','cà phê',1),(21,'/image/8.png','B_002','cà phê sữa đá',20000.00,'cà phê với sữa đặc','S','cà phê',1),(22,'/image/9.png','B_003','cà phê sữa nóng',20000.00,'mùi thơm coffe nguyên chất','M','cà phê',1),(23,'/image/10.png','C_001','sữa tươi trân châu đường đen',30000.00,'ngọt từ đường đen','M','trà sữa',1),(24,'/image/11.png','C_002','trà sữa trân châu kem cheese',40000.00,'lớp kem ngọt béo','L','trà sữa',1),(25,'/image/12.png','C_003','trà sữa trân châu ',19000.00,'trân châu đen dai ngon','M','trà sữa',1),(26,'/image/13.png','C_004','trà sữa trân châu hoàng kim',35000.00,'trân châu hoàng kim dai sựt','L','trà sữa',1),(27,'/image/14.png','C_005','trà sữa matcha váng sữa',30000.00,'vị matcha cùng với váng sữa','M','trà sữa',1),(28,'/image/15.png','D_000','trà chanh dâu',30000.00,'vị chua của chanh kết hợp với dâu','L','trà trái cây',1),(29,'/image/16.png','D_001','trà chanh',35000.00,'vị chanh thanh mát','XL','trà trái cây',1),(30,'/image/17.png','D_002','trà chanh dây',35000.00,'chanh dây chua chua','L','trà trái cây',1),(31,'/image/18.png','D_003','trà trái cây',40000.00,'nhiều trái cây hòa quyện','L','trà trái cây',1),(32,'/image/19.png','D_004','trà cam',30000.00,'cam chua chua','L','trà trái cây',1),(33,'/image/20.png','D_005','trà đào',30000.00,'vj đào lạnh\n','L','trà trái cây',1),(36,'https://tse3.mm.bing.net/th/id/OIP.s0HPL08jqkIGu2CF1VtADgAAAA?cb=thfc1&pid=ImgDet&w=199&h=199&c=7&o=7&rm=3','L_001','Bánh kem nho',30000.00,'ngọt và béo của kem','M','bánh',1),(37,'https://www.bing.com/th/id/OIP.PKHQXGHauhOZt5Lz3H9DvwHaHa?w=193&h=193&c=8&rs=1&qlt=90&o=6&pid=3.1&rm=2','L_000','Bánh sừng bò',15000.00,'bánh mì mềm, ngọt','S','bánh',1),(38,'https://tse4.mm.bing.net/th/id/OIP.V3HFwz4DAbnX8WN2KULbZAHaHa?cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3','L_006','Bánh mì',15000.00,'bánh mì mềm','S','bánh',1),(39,'https://thf.bing.com/th/id/OIP.z38b8YiXC0Xrl8HjtWFEPwHaHa?w=183&h=183&c=7&r=0&o=7&cb=thfc1&pid=1.7&rm=3','L_020','Bánh donut',20000.00,'Bánh ngọt vừa','S','bánh',1),(40,'https://tse2.mm.bing.net/th/id/OIP.L3ZjGExxX8I8-rao5wEhbgHaGB?cb=thfc1&pid=ImgDet&w=199&h=161&c=7&o=7&rm=3','G_006','Bánh donut doublue',35000.00,'Bánh ăn nhẹ','M','bánh',1),(41,'https://tse4.mm.bing.net/th/id/OIP.f2FdbhuXtFunvEArJiXk2QAAAA?cb=thfc1&pid=ImgDet&w=199&h=199&c=7&o=7&rm=3','L_008','Bánh trứng',18000.00,'bánh béo ngậy','Không có','bánh',1),(42,'https://thf.bing.com/th/id/OIP.OwiasKJl8CMxeNws8kzSYgHaHa?w=184&h=184&c=7&r=0&o=7&cb=thfc1&pid=1.7&rm=3','L_007','Bánh kếp trái cây',28000.00,'Vị ngọt của mật ong ','Không có','bánh',1),(43,'https://images.pexels.com/photos/37418888/pexels-photo-37418888.jpeg?auto=compress&cs=tinysrgb&h=650&w=940','C_006','Bánh kếp socola',35000.00,'Bánh mềm và ngọt của socola','Không','bánh',1),(44,'https://tse4.mm.bing.net/th/id/OIP.MQ8Cu9_R4zPy1-twFaP_6gAAAA?cb=thfc1&pid=ImgDet&w=199&h=199&c=7&o=7&rm=3','D_009','Bánh bao hoàng kim',29000.00,'Mùi thơm ngất ngây','Không','bánh',1),(45,'https://thf.bing.com/th/id/OIP.T2YQZeIxYvesX8AiDsO5TQHaHa?w=184&h=184&c=7&r=0&o=7&cb=thfc1&pid=1.7&rm=3','J_000','Bánh nướng việt quất',20000.00,'Giòn tan','Không','bánh',1),(46,'https://img.lovepik.com/png/20231014/Crispy-and-delicious-seaweed-biscuit-food-snack-snack-meal-replacement_205533_wh300.png','K_009','Bánh quy nướng',19000.00,'Bánh giòn ','Mini','bánh',1),(47,'https://thf.bing.com/th/id/OIP.vNhIJYtMhTPmQf7Pl4-ZhgHaHa?w=192&h=195&c=7&r=0&o=7&cb=thfc1&pid=1.7&rm=3','B_009','Bánh sandwitch',25000.00,'Bánh gồm nhân xúc xích','Không','bánh',1),(48,'https://tse4.mm.bing.net/th/id/OIP.KWMrMw24H-U1qhpfO5cG1wAAAA?cb=thfc1&pid=ImgDet&w=199&h=199&c=7&o=7&rm=3','M_005','Bánh su kem',19000.00,'Bánh có nhân sữa béo','Không','bánh',1),(49,'https://www.bing.com/th/id/OIP.zNAJ96IA92RUNCkwoSPcjAHaHa?w=193&h=193&c=8&rs=1&qlt=90&o=6&pid=3.1&rm=2','H_000','Bánh kem dâu',50000.00,'Dâu tây ngọt ','Không','bánh',1),(50,'https://tse1.mm.bing.net/th/id/OIP.7k-a9LNc4QDjZMOOo_oRVgHaHa?cb=thfc1&pid=ImgDet&w=199&h=199&c=7&o=7&rm=3','R_000','Bánh macaron',18000.00,'Với nhiều hương vị khác nhau','Mini','bánh',1),(51,'https://img.lovepik.com/element/40033/7006.png_300.png','D_008','Americo nóng',25000.00,'Thích hợp cho những người không uống đường','Không có','cà phê',1),(52,'https://img.lovepik.com/free-png/20220118/lovepik-matcha-smoothie-png-image_401452703_wh300.png','F_006','Sinh tố matcha',35000.00,'Vị hơi đắng nhẹ của matcha nhật','L','sinh tố',1),(53,'https://img.lovepik.com/element/40257/3777.png_300.png','J_008','Sinh tố đá bào đào mọng',50000.00,'Đào thanh mát','L','sinh tố',1),(54,'https://img.lovepik.com/free-png/20211230/lovepik-strawberry-milk-tea-png-image_401021104_wh300.png','C_007','Trà sữa dâu',25000.00,'Vị dâu chua','M','trà sữa',1),(55,'https://img.lovepik.com/element/40102/1115.png_300.png','V_000','Trà sữa khoai môn',28000.00,'Vị khoai môn bùi','L','trà sữa',1),(56,'https://img.lovepik.com/element/40247/1964.png_300.png','F_008','Trà sữa thái trân châu kem cheese',39000.00,'Vị thái đỏ','L','trà sữa',1),(57,'https://img.lovepik.com/png/20231024/Red-Apple-Fruit-Boker-Tea-ice-cube-bobo-tea-cartoon_331189_wh300.png','H_005','Trà táo',45000.00,'Vị ngọt thanh','L','trà trái cây',1),(58,'https://img.lovepik.com/free-png/20220109/lovepik-grapefruit-tea-png-image_401331774_wh300.png','C_009','Trà bưởi',30000.00,'Vị ngọt của bưởi','L','trà trái cây',1),(59,'https://img.lovepik.com/png/20231024/Grapebine-fruit-Bobo-Tea-vitamins-strawberry-gift_336285_wh300.png','X_000','Trà nho',35000.00,'Hơi chưa nhẹ','L','trà trái cây',1),(60,'https://images.pexels.com/photos/26951896/pexels-photo-26951896.jpeg?auto=compress&cs=tinysrgb&h=650&w=940','V_005','Trà cam việt quất',45000.00,'Vị chua','L','trà trái cây',1),(61,'https://images.pexels.com/photos/14111068/pexels-photo-14111068.jpeg?auto=compress&cs=tinysrgb&h=650&w=940','H_004','Cà phê đen nóng',18000.00,'Cà phê đen nóng ','Không','cà phê',1),(62,'https://images.pexels.com/photos/10303534/pexels-photo-10303534.jpeg?auto=compress&cs=tinysrgb&h=650&w=940','J_006','Cacao nóng',35000.00,'GIúp ấm áp','M','cà phê',1),(63,'https://img.lovepik.com/png/20231017/Green-snowflake-cup-with-Christmas-cinnamon-hot-cocoa-hot-drink_241592_wh300.png','J_008','Cacao đá kem muối',45000.00,'Mát lạnh','L','cà phê',1);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating` int DEFAULT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,15,8,3,'ngon nha','2025-08-23 15:04:27'),(2,15,8,2,'tạm\n','2025-08-23 15:04:45'),(3,15,8,5,'tuyệt','2025-08-23 15:16:07'),(4,15,8,5,NULL,'2025-08-23 15:16:39'),(5,15,8,5,NULL,'2025-08-23 15:16:45'),(6,15,8,5,'ngon nha','2025-08-23 15:19:28'),(7,15,8,4,'ngon','2025-08-27 11:28:01'),(8,16,1,5,'k','2025-08-27 12:07:27'),(9,16,1,5,NULL,'2025-08-27 12:07:31'),(10,23,1,3,NULL,'2026-03-28 13:57:30');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sepay_webhook_logs`
--

DROP TABLE IF EXISTS `sepay_webhook_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sepay_webhook_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sepay_transaction_id` varchar(100) NOT NULL,
  `payment_id` int DEFAULT NULL,
  `transaction_code` varchar(100) DEFAULT NULL,
  `transfer_amount` decimal(10,2) DEFAULT NULL,
  `transfer_type` enum('in','out') DEFAULT NULL,
  `reference_code` varchar(100) DEFAULT NULL,
  `payload` longtext,
  `status` enum('received','ignored','payment_not_found','amount_mismatch','confirmed') DEFAULT 'received',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sepay_transaction_id` (`sepay_transaction_id`),
  KEY `payment_id` (`payment_id`),
  CONSTRAINT `sepay_webhook_logs_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sepay_webhook_logs`
--

LOCK TABLES `sepay_webhook_logs` WRITE;
/*!40000 ALTER TABLE `sepay_webhook_logs` DISABLE KEYS */;
INSERT INTO `sepay_webhook_logs` VALUES (1,'990000110',110,'DH1780507504980',18000.00,'in','LOCALCHECK990000110','{\"id\":990000110,\"transactionDate\":\"2026-06-04 10:00:00\",\"content\":\"SEVQR DH1780507504980\",\"referenceCode\":\"LOCALCHECK990000110\",\"accountNumber\":\"101879499413\",\"transferType\":\"in\",\"transferAmount\":18000,\"gateway\":\"VietinBank\",\"code\":\"DH1780507504980\"}','confirmed','2026-06-03 17:34:05'),(2,'61743745',110,'DH1780507504980',18000.00,'in','28ouE-89aq6len6','{\"gateway\":\"VietinBank\",\"transactionDate\":\"2026-06-04 00:32:03\",\"accountNumber\":\"101879499413\",\"subAccount\":null,\"code\":\"DH1780507504\",\"content\":\"131906923781-0354780511-SEVQR DH1780507504980\",\"transferType\":\"in\",\"description\":\"BankAPINotify 131906923781-0354780511-SEVQR DH1780507504980\",\"transferAmount\":18000,\"referenceCode\":\"28ouE-89aq6len6\",\"accumulated\":116034,\"id\":61743745}','confirmed','2026-06-03 17:36:10'),(3,'61744001',111,'DH1780508211992',29000.00,'in','mwrm-89aqRWfW6','{\"gateway\":\"VietinBank\",\"transactionDate\":\"2026-06-04 00:37:10\",\"accountNumber\":\"101879499413\",\"subAccount\":null,\"code\":\"DH1780508211\",\"content\":\"131907294102-0354780511-SEVQR DH1780508211992\",\"transferType\":\"in\",\"description\":\"BankAPINotify 131907294102-0354780511-SEVQR DH1780508211992\",\"transferAmount\":29000,\"referenceCode\":\"mwrm-89aqRWfW6\",\"accumulated\":116034,\"id\":61744001}','confirmed','2026-06-03 17:37:16'),(4,'61743661',110,'DH1780507504980',18000.00,'in','qWTq-89aq06DWY','{\"gateway\":\"VietinBank\",\"transactionDate\":\"2026-06-04 00:30:25\",\"accountNumber\":\"101879499413\",\"subAccount\":null,\"code\":\"DH1780507504\",\"content\":\"131906953099-0354780511-SEVQR DH1780507504980\",\"transferType\":\"in\",\"description\":\"BankAPINotify 131906953099-0354780511-SEVQR DH1780507504980\",\"transferAmount\":18000,\"referenceCode\":\"qWTq-89aq06DWY\",\"accumulated\":116034,\"id\":61743661}','confirmed','2026-06-03 17:37:29'),(5,'61743439',110,'DH1780507504980',18000.00,'in','fnoa-89apfuyiA','{\"gateway\":\"VietinBank\",\"transactionDate\":\"2026-06-04 00:25:26\",\"accountNumber\":\"101879499413\",\"subAccount\":null,\"code\":\"DH1780507504\",\"content\":\"131906750185-0354780511-SEVQR DH1780507504980\",\"transferType\":\"in\",\"description\":\"BankAPINotify 131906750185-0354780511-SEVQR DH1780507504980\",\"transferAmount\":18000,\"referenceCode\":\"fnoa-89apfuyiA\",\"accumulated\":116034,\"id\":61743439}','confirmed','2026-06-03 17:37:39'),(6,'61883438',112,'DH1780591465960',50000.00,'in','RDzy-89cJKY4B8','{\"gateway\":\"VietinBank\",\"transactionDate\":\"2026-06-04 23:44:55\",\"accountNumber\":\"101879499413\",\"subAccount\":null,\"code\":\"DH1780591465\",\"content\":\"132050699216-0354780511-SEVQR DH1780591465960\",\"transferType\":\"in\",\"description\":\"BankAPINotify 132050699216-0354780511-SEVQR DH1780591465960\",\"transferAmount\":50000,\"referenceCode\":\"RDzy-89cJKY4B8\",\"accumulated\":116034,\"id\":61883438}','confirmed','2026-06-04 16:45:00'),(7,'61883900',114,'DH1780592069364',28000.00,'in','1mXqc-89cJymyVr','{\"gateway\":\"VietinBank\",\"transactionDate\":\"2026-06-04 23:54:49\",\"accountNumber\":\"101879499413\",\"subAccount\":null,\"code\":\"DH1780592069\",\"content\":\"132051235809-0354780511-SEVQR DH1780592069364\",\"transferType\":\"in\",\"description\":\"BankAPINotify 132051235809-0354780511-SEVQR DH1780592069364\",\"transferAmount\":28000,\"referenceCode\":\"1mXqc-89cJymyVr\",\"accumulated\":116034,\"id\":61883900}','confirmed','2026-06-04 16:54:53'),(8,'61884226',117,'DH1780592436261',39000.00,'in','11Fd4-89cKNQ2wS','{\"gateway\":\"VietinBank\",\"transactionDate\":\"2026-06-05 00:00:53\",\"accountNumber\":\"101879499413\",\"subAccount\":null,\"code\":\"DH1780592436\",\"content\":\"132051592099-0354780511-SEVQR DH1780592436261\",\"transferType\":\"in\",\"description\":\"BankAPINotify 132051592099-0354780511-SEVQR DH1780592436261\",\"transferAmount\":39000,\"referenceCode\":\"11Fd4-89cKNQ2wS\",\"accumulated\":116034,\"id\":61884226}','confirmed','2026-06-04 17:00:57'),(9,'61884555',118,'DH1780592760877',39000.00,'in','2GF9i-89cKkDBWJ','{\"gateway\":\"VietinBank\",\"transactionDate\":\"2026-06-05 00:06:30\",\"accountNumber\":\"101879499413\",\"subAccount\":null,\"code\":\"DH1780592760\",\"content\":\"132051919867-0354780511-SEVQR DH1780592760877\",\"transferType\":\"in\",\"description\":\"BankAPINotify 132051919867-0354780511-SEVQR DH1780592760877\",\"transferAmount\":39000,\"referenceCode\":\"2GF9i-89cKkDBWJ\",\"accumulated\":116034,\"id\":61884555}','confirmed','2026-06-04 17:06:31'),(10,'61886109',124,'DH1780594967605',45000.00,'in','1MhFK-89cN8XIMh','{\"gateway\":\"VietinBank\",\"transactionDate\":\"2026-06-05 00:43:02\",\"accountNumber\":\"101879499413\",\"subAccount\":null,\"code\":\"DH1780594967\",\"content\":\"132054005457-0354780511-SEVQR DH1780594967605\",\"transferType\":\"in\",\"description\":\"BankAPINotify 132054005457-0354780511-SEVQR DH1780594967605\",\"transferAmount\":45000,\"referenceCode\":\"1MhFK-89cN8XIMh\",\"accumulated\":116034,\"id\":61886109}','confirmed','2026-06-04 17:43:08'),(11,'61886473',128,'DH1780595663666',35000.00,'in','OTWo-89cNtoEkX','{\"gateway\":\"VietinBank\",\"transactionDate\":\"2026-06-05 00:54:40\",\"accountNumber\":\"101879499413\",\"subAccount\":null,\"code\":\"DH1780595663\",\"content\":\"132054564209-0354780511-SEVQR DH1780595663666\",\"transferType\":\"in\",\"description\":\"BankAPINotify 132054564209-0354780511-SEVQR DH1780595663666\",\"transferAmount\":35000,\"referenceCode\":\"OTWo-89cNtoEkX\",\"accumulated\":116034,\"id\":61886473}','confirmed','2026-06-04 17:54:46');
/*!40000 ALTER TABLE `sepay_webhook_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `sugar_level` varchar(50) DEFAULT NULL,
  `ice_level` varchar(50) DEFAULT NULL,
  `favorite_category` varchar(255) DEFAULT NULL,
  `favorite_product` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_preferences`
--

LOCK TABLES `user_preferences` WRITE;
/*!40000 ALTER TABLE `user_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_vouchers`
--

DROP TABLE IF EXISTS `user_vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_vouchers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `voucher_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `voucher_id` (`voucher_id`),
  CONSTRAINT `user_vouchers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_vouchers_ibfk_2` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_vouchers`
--

LOCK TABLES `user_vouchers` WRITE;
/*!40000 ALTER TABLE `user_vouchers` DISABLE KEYS */;
INSERT INTO `user_vouchers` VALUES (1,8,2,'2025-08-27 06:24:42'),(2,10,2,'2025-08-27 06:24:42'),(3,17,2,'2025-08-27 06:29:04'),(4,8,2,'2025-08-27 06:29:45'),(5,8,2,'2025-08-27 06:38:11'),(6,10,2,'2025-08-27 06:38:11'),(7,8,3,'2025-08-27 06:38:59'),(8,8,9,'2025-11-26 14:22:24'),(9,10,9,'2025-11-26 14:22:24'),(10,8,10,'2026-04-04 15:34:24'),(11,10,10,'2026-04-04 15:34:24'),(12,15,10,'2026-04-04 15:34:24'),(13,16,11,'2026-04-08 15:57:24'),(14,8,11,'2026-04-08 15:58:31'),(15,10,11,'2026-04-08 15:58:31'),(16,15,11,'2026-04-08 15:58:31');
/*!40000 ALTER TABLE `user_vouchers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','staff','admin') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  `points` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'user','huynhnguyentuananh0511@gmail.com','$2b$08$hWCr9V4PBcVy7dAtULRUUed0fcwu456LfhG9HnpVw2fR1tOr.Q6bG','admin','2025-03-16 07:54:19','2026-06-03 17:14:36',1,0),(6,'anh','huynhnguyentuananh11@gmail.com','$2b$08$21Agag1ByL/M5EqmTmBTi.gaht7OBAqT0PrnFnve7GWlmcZMFjlxy','staff','2025-03-16 08:00:07','2026-05-03 05:58:39',1,0),(7,'anhz','huynhnguyentuananh0211@gmail.com','$2b$08$vn3C4VCtIccOJUICjy5FDOgRlovYMRM4Ox.xQBhfuTnydMC3hVu/a','staff','2025-05-22 19:44:12','2025-06-26 21:11:03',1,0),(8,'Tuấn Anh','tuananh02@gmail.com','$2b$08$hjvAzNt/y3BbhTyj/XTQ9.GU31z2/D5cTjwjwrXdDFnCZrm6VNU8m','user','2025-06-19 18:45:16','2026-06-06 05:29:52',1,146),(10,'Tuấn Anh Huỳnh Nguyễn','kazukitatsuza@gmail.com','','user','2025-06-26 19:09:20','2025-06-26 19:09:20',1,0),(13,'alex','alexsan225@gmail.com','$2b$08$zqlgOn8J5Wndl/zb5Khbx.CetTp7DSvgOVmMzkfnhb0GdgFH3TqDa','staff','2025-07-02 04:53:14','2025-07-08 21:28:26',1,0),(14,'sam','sam00@gmail.com','$2b$08$F6kcJ.B30Gq067nJplxItOrENXSkDAuQbaLXcknL8SVzyhREOdFA6','staff','2025-07-02 05:02:34','2025-07-02 05:02:34',1,0),(15,'pedri','johhson55@gmail.com','$2b$08$5VRz4fC4qhGDVwElqiVnJesGcZqzCgXAcPV7kHcGYmfRax9bOviIS','user','2025-07-02 05:06:04','2026-03-28 14:31:40',1,0),(16,'john','john123@gmail.com','$2b$08$D0lKfvl20OIKSIMwdNgMiObj4RruTKEYX0itz/pB6u4j1zgRzefeK','staff','2025-07-02 05:08:06','2025-07-02 05:08:06',1,0),(17,'bell','bell00@gmail.com','$2b$08$bLNyMdUSA9ebf2WXsN4B8uOL7sgnSiXC9oOTn0nZAp/kbAp7qTfn6','staff','2025-07-02 05:09:01','2025-07-02 05:09:01',1,0),(18,'barry','barry123@gmail.com','$2b$08$dv6/R7DIBmnOUeEe88sZzuSgb3r8/JlxxywN0DtEfDU6HBpZmv62K','staff','2026-04-10 12:20:50','2026-04-10 12:21:53',1,0),(19,'alexxan','huynhnguyentuananh0311@gmail.com','$2b$08$5ebPL.whIUK5yF9S8Vemo.Yx1fEMh/QJ6WdKuODtf5ZZRk4ipd9sq','staff','2026-05-21 10:17:07','2026-05-21 10:17:07',1,0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vouchers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `discount_type` enum('percent','amount') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_order` decimal(10,2) DEFAULT '0.00',
  `expired_at` datetime NOT NULL,
  `usage_limit` int DEFAULT '1',
  `used_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES (1,'F123','percent',10.00,10.00,'2025-08-24 00:00:00',10,0,'2025-08-23 15:58:22'),(2,'501230519','percent',15.00,0.00,'2025-08-28 00:00:00',10,0,'2025-08-27 06:04:45'),(3,'0555','amount',15.00,20.00,'2025-08-31 00:00:00',10,0,'2025-08-27 06:38:52'),(4,'5235556','percent',20000.00,15000.00,'2025-08-29 00:00:00',5,0,'2025-08-27 11:46:45'),(5,'0000000','percent',20.00,25.00,'2025-08-30 00:00:00',5,0,'2025-08-27 11:56:48'),(6,'25555','percent',20000.00,25.00,'2025-08-29 00:00:00',10,0,'2025-08-27 11:57:30'),(7,'08953','percent',5.00,15000.00,'2025-08-29 00:00:00',5,0,'2025-08-27 12:02:26'),(8,'FGZLOGD','percent',15.00,20.00,'2025-08-31 00:00:00',5,0,'2025-08-28 05:23:48'),(9,'050311','percent',20.00,50000.00,'2025-11-28 00:00:00',2,1,'2025-11-26 14:22:19'),(10,'SALE50','percent',20.00,75000.00,'2026-04-10 00:00:00',1,1,'2026-04-04 15:34:18'),(11,'sale57','percent',40.00,70000.00,'2026-04-09 00:00:00',10,0,'2026-04-08 15:57:16');
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-07  3:13:23
