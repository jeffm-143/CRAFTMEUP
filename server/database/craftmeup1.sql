-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 21, 2025 at 04:05 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `craftmeup`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `name`, `email`, `password`, `created_at`, `updated_at`) VALUES
(1, 'Admin User', 'admin@craftmeup.com', 'admin', '2025-10-01 03:43:07', '2025-10-01 03:43:07');

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `expiration_date` datetime DEFAULT NULL,
  `target_audience` varchar(50) NOT NULL DEFAULT 'All Users',
  `status` varchar(50) DEFAULT 'active',
  `expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `title`, `content`, `expiration_date`, `target_audience`, `status`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'Testing', 'Testing1111111111', NULL, 'All Users', 'active', NULL, '2025-09-30 09:31:50', '2025-09-30 10:01:20'),
(2, 'Testing2', 'Testing 2', NULL, 'Providers Only', 'active', NULL, '2025-09-30 09:32:31', '2025-09-30 09:32:31'),
(3, 'Tutors', 'Tutors', NULL, 'Tutors Only', 'active', NULL, '2025-09-30 09:44:43', '2025-09-30 09:44:43'),
(5, 'Hahahahha', 'hahahahaha', NULL, 'All Users', 'active', NULL, '2025-09-30 09:52:38', '2025-09-30 09:52:38'),
(6, 'LOG', 'LOGS', NULL, 'Learners Only', 'active', NULL, '2025-09-30 09:53:48', '2025-10-01 03:32:53'),
(7, 'Annoucement', 'Annoucement', NULL, 'Tutors Only', 'active', NULL, '2025-10-01 03:33:00', '2025-10-01 03:33:00');

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `feedback`
--

INSERT INTO `feedback` (`id`, `service_id`, `user_id`, `rating`, `comment`, `created_at`) VALUES
(1, 8, 6, 5, 'Its okay', '2025-09-30 16:25:34'),
(2, 8, 6, 5, 'NICE GOODS', '2025-09-30 16:55:50'),
(3, 8, 6, 5, 'Nicessss', '2025-10-01 03:28:07'),
(4, 8, 6, 5, 'ITs was GOOD', '2025-10-01 04:22:47'),
(5, 9, 6, 4, 'okayss nalang', '2025-10-01 05:17:25'),
(6, 8, 6, 5, 'nice', '2025-10-01 06:04:20'),
(7, 8, 6, 5, '', '2025-10-27 21:56:13'),
(8, 8, 6, 5, '', '2025-10-27 23:06:19'),
(9, 8, 6, 5, 'HAHAHAHAHAHA', '2025-10-28 03:00:01'),
(10, 8, 6, 1, 'asdasd', '2025-10-28 03:38:25'),
(11, 11, 6, 1, '', '2025-10-28 22:09:28'),
(12, 11, 6, 1, '', '2025-10-28 22:52:55'),
(13, 8, 6, 1, '', '2025-10-28 23:59:01'),
(14, 8, 6, 1, '', '2025-10-29 00:38:43'),
(15, 11, 6, 5, '', '2025-10-29 03:08:22'),
(16, 11, 6, 5, '', '2025-10-29 03:12:39'),
(17, 11, 6, 5, 'asdasd', '2025-10-29 03:14:21'),
(18, 11, 6, 5, 'asdasdasdasd', '2025-10-29 03:25:10'),
(19, 8, 6, 5, 'asdasd', '2025-10-29 03:35:11'),
(20, 11, 7, 5, 'asdasdas', '2025-10-29 03:37:48'),
(21, 11, 7, 5, 'asdasdas', '2025-10-29 03:50:13'),
(22, 11, 7, 5, 'asdasdas', '2025-10-29 04:01:57'),
(23, 11, 7, 5, 'asdasdas', '2025-10-29 04:03:46'),
(24, 11, 7, 5, 'asdasdas', '2025-10-29 04:33:21'),
(25, 11, 7, 5, 'asdasdas', '2025-10-29 04:34:41'),
(26, 11, 7, 5, 'asdasdasasdasd', '2025-10-29 04:48:58'),
(27, 11, 7, 5, 'asdasdasasdasd', '2025-10-29 04:51:18'),
(28, 11, 7, 5, 'asdasdasasdasd', '2025-10-29 04:56:46'),
(29, 11, 7, 5, 'asdasdasasdasd', '2025-10-29 05:01:47'),
(30, 11, 7, 5, 'asdasdasasdasd', '2025-10-29 05:03:51'),
(31, 11, 7, 5, 'asdasdasasdasd', '2025-10-29 05:09:27'),
(32, 11, 7, 5, 'asdasdasasdasd', '2025-10-29 05:09:36'),
(33, 11, 7, 5, 'asdasdasasdasd', '2025-10-29 05:35:09'),
(34, 11, 7, 5, 'asdasdasasdasd', '2025-10-29 05:38:14'),
(35, 11, 7, 5, 'asdasdasasdasd', '2025-10-29 05:40:20'),
(36, 11, 7, 5, 'asdasdasasdasd', '2025-10-29 06:29:08'),
(37, 11, 7, 5, 'asdasdasasdasd', '2025-10-29 06:30:39'),
(38, 8, 6, 5, 'asdasd', '2025-10-29 09:08:04');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `sender_name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `read_status` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `message`, `sender_name`, `created_at`, `read_status`) VALUES
(1, 6, 7, 'hello', 'User', '2025-11-21 01:42:06', 0),
(2, 7, 6, 'HI sad', 'Mark Dave Catubigs', '2025-11-21 01:42:26', 0),
(3, 6, 7, 'can we have a convesation', 'User', '2025-11-21 01:43:56', 0),
(4, 6, 7, 'hahaha', 'User', '2025-11-21 01:45:31', 0),
(5, 7, 6, 'yeah boy', 'Mark Dave Catubigs', '2025-11-21 01:54:35', 0),
(6, 6, 7, 'hahahahaasdasd', 'User', '2025-11-21 01:58:34', 0),
(7, 6, 7, 'tarung ba', 'User', '2025-11-21 02:00:30', 0),
(8, 7, 6, 'real', 'Mark Dave Catubigs', '2025-11-21 02:08:38', 0),
(9, 6, 7, 'real??', 'User', '2025-11-21 02:32:45', 0),
(10, 6, 7, 'hello', 'User', '2025-11-21 02:52:48', 0),
(11, 6, 7, 'typing', 'User', '2025-11-21 02:57:54', 0),
(12, 7, 6, 'typing', 'User', '2025-11-21 02:58:31', 0);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `content`, `read`, `created_at`) VALUES
(1, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 02:55:34'),
(2, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 03:07:54'),
(3, 6, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 03:07:55'),
(4, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Jeff Monreal', 1, '2025-10-29 03:08:19'),
(5, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 03:11:47'),
(6, 6, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 03:11:48'),
(7, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Jeff Monreal', 1, '2025-10-29 03:12:37'),
(8, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 03:13:59'),
(9, 6, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 03:14:00'),
(10, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Jeff Monreal', 1, '2025-10-29 03:14:18'),
(11, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 03:24:53'),
(12, 6, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 03:24:54'),
(13, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Jeff Monreal', 1, '2025-10-29 03:25:08'),
(14, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 03:34:52'),
(15, 6, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Mark Dave Catubigs', 1, '2025-10-29 03:34:53'),
(16, 7, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Jeff Monreal', 1, '2025-10-29 03:35:08'),
(17, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 03:37:17'),
(18, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 03:37:18'),
(19, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by undefined', 1, '2025-10-29 03:37:44'),
(20, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 03:50:00'),
(21, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 03:50:10'),
(22, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 04:01:47'),
(23, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 04:01:55'),
(24, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 04:03:35'),
(25, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 04:03:36'),
(26, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 04:03:44'),
(27, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 04:33:09'),
(28, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 04:33:10'),
(29, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 04:33:18'),
(30, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 04:34:30'),
(31, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 04:34:31'),
(32, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 04:34:38'),
(33, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 04:48:22'),
(34, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 04:48:41'),
(35, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 04:48:42'),
(36, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 04:48:54'),
(37, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 04:51:05'),
(38, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 04:51:06'),
(39, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 04:51:16'),
(40, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 04:56:27'),
(41, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 04:56:37'),
(42, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 04:56:37'),
(43, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 04:56:44'),
(44, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:01:29'),
(45, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 05:01:30'),
(46, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 05:01:46'),
(47, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:03:40'),
(48, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 05:03:41'),
(49, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 05:03:49'),
(50, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 05:09:14'),
(51, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 05:09:17'),
(52, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 05:09:26'),
(53, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 05:09:35'),
(54, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:23:41'),
(55, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:23:48'),
(56, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 05:23:49'),
(57, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 05:35:07'),
(58, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:36:38'),
(59, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:36:51'),
(60, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 05:36:53'),
(61, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 05:38:12'),
(62, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:38:25'),
(63, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:39:55'),
(64, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 05:40:09'),
(65, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 05:40:19'),
(66, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:41:33'),
(67, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:42:42'),
(68, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:42:53'),
(69, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:43:07'),
(70, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:43:11'),
(71, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:43:14'),
(72, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:43:26'),
(73, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:43:41'),
(74, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:43:45'),
(75, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:44:15'),
(76, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:44:19'),
(77, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:44:29'),
(78, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:44:51'),
(79, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:45:08'),
(80, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:45:13'),
(81, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:45:17'),
(82, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:46:05'),
(83, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:46:12'),
(84, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:46:19'),
(85, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:46:21'),
(86, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:50:01'),
(87, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:50:46'),
(88, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:50:54'),
(89, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:51:00'),
(90, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:55:40'),
(91, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:55:42'),
(92, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 05:55:48'),
(93, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:03:47'),
(94, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:03:50'),
(95, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:04:03'),
(96, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:05:22'),
(97, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:05:32'),
(98, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:07:44'),
(99, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:07:46'),
(100, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:08:00'),
(101, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:09:14'),
(102, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:09:38'),
(103, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:09:47'),
(104, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:21:31'),
(105, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:21:31'),
(106, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:21:31'),
(107, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:21:31'),
(108, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:28:58'),
(109, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 06:28:59'),
(110, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 06:29:07'),
(111, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:29:54'),
(112, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:30:00'),
(113, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:30:06'),
(114, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:30:12'),
(115, 5, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Mark Dave Catubigs', 1, '2025-10-29 06:30:27'),
(116, 7, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Alexus Sagaral', 1, '2025-10-29 06:30:28'),
(117, 5, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by Mark Dave Catubigs', 1, '2025-10-29 06:30:37'),
(118, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:04:30'),
(119, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:04:30'),
(120, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:04:30'),
(121, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:04:30'),
(122, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:04:30'),
(123, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:04:30'),
(124, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:06:36'),
(125, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:06:36'),
(126, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:06:36'),
(127, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:06:36'),
(128, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:06:36'),
(129, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:06:36'),
(130, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:05'),
(131, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:05'),
(132, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:05'),
(133, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:05'),
(134, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:05'),
(135, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:07'),
(136, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:07'),
(137, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:07'),
(138, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:07'),
(139, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:08'),
(140, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:08'),
(141, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:08'),
(142, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:12'),
(143, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:12'),
(144, 7, 'tutor_request', 'New Tutor Request', 'You got a Tutor request from Jeff Monreal', 1, '2025-10-29 09:07:13'),
(145, 6, 'request_accepted', 'Tutor Request Accepted', 'Your tutor request has been accepted by Mark Dave Catubigs', 1, '2025-10-29 09:07:25'),
(146, 7, 'payment_confirmed', 'Payment Confirmed', 'Payment has been confirmed by undefined', 1, '2025-10-29 09:08:03');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `reported_user_id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','resolved','suspended','invalid') DEFAULT 'pending',
  `violation_type` enum('minor','serious','abuse') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `reported_user_id`, `reporter_id`, `reason`, `description`, `status`, `violation_type`, `created_at`, `updated_at`) VALUES
(2, 7, 6, 'spam', 'Ni hilak siya', 'invalid', 'minor', '2025-10-28 23:58:58', '2025-10-28 23:59:56'),
(3, 7, 6, 'spam', 'sigi storya wlay tudlo', 'invalid', NULL, '2025-10-29 00:38:40', '2025-10-29 01:01:47');

-- --------------------------------------------------------

--
-- Table structure for table `saved_services`
--

CREATE TABLE `saved_services` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `availability` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `user_id`, `title`, `description`, `category`, `price`, `availability`, `status`, `created_at`, `updated_at`) VALUES
(8, 7, 'Hand Embroidery Essentials', 'Basic stitches and pattern making for clothing or décor.', NULL, 20.00, 'Weekends', 'active', '2025-09-30 15:59:40', '2025-09-30 15:59:40'),
(9, 7, 'TItle', 'Description ', NULL, 100.00, 'Mon Only', 'active', '2025-10-01 04:50:47', '2025-10-01 04:50:47'),
(10, 7, 'service', 'Service', NULL, 50.00, 'Mondayss', 'active', '2025-10-01 05:56:56', '2025-10-29 09:11:29'),
(11, 5, 'asd', 'asd', NULL, 10.00, 'asd', 'active', '2025-10-28 01:48:30', '2025-10-28 01:48:30'),
(12, 5, 'NEW', 'new', NULL, 10.00, 'Monday', 'active', '2025-10-29 06:51:19', '2025-10-29 08:17:54');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `service_id` int(11) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `reference_number` varchar(100) DEFAULT NULL,
  `payment_proof` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `service_id`, `type`, `amount`, `status`, `reference_number`, `payment_proof`, `created_at`, `updated_at`) VALUES
(7, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-09-30 16:02:31', '2025-09-30 16:17:04'),
(8, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-09-30 16:49:56', '2025-09-30 16:50:10'),
(9, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-09-30 16:53:11', '2025-09-30 16:54:15'),
(10, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-09-30 16:55:14', '2025-09-30 16:55:41'),
(11, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-10-01 03:25:10', '2025-10-01 03:27:54'),
(12, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-10-01 04:20:06', '2025-10-01 04:22:38'),
(13, 6, 9, 'booking', 100.00, 'completed', NULL, NULL, '2025-10-01 04:52:17', '2025-10-01 05:17:18'),
(14, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-10-01 06:03:36', '2025-10-01 06:04:15'),
(15, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-10-27 20:54:18', '2025-10-27 21:56:08'),
(16, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-10-27 23:05:54', '2025-10-27 23:06:17'),
(17, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-10-28 02:54:30', '2025-10-28 02:55:50'),
(18, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-10-28 02:56:09', '2025-10-28 02:56:25'),
(19, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-10-28 03:22:19', '2025-10-28 03:22:56'),
(20, 6, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-28 22:08:41', '2025-10-28 22:09:01'),
(21, 6, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-28 22:50:26', '2025-10-28 22:51:53'),
(22, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-10-28 23:57:39', '2025-10-28 23:58:17'),
(23, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-10-29 00:38:05', '2025-10-29 00:38:22'),
(24, 6, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 02:49:10', '2025-10-29 03:08:19'),
(25, 6, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 03:10:48', '2025-10-29 03:12:37'),
(26, 6, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 03:13:32', '2025-10-29 03:14:18'),
(27, 6, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 03:23:57', '2025-10-29 03:25:08'),
(28, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-10-29 03:34:32', '2025-10-29 03:35:08'),
(29, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 03:37:02', '2025-10-29 03:37:44'),
(30, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 03:49:31', '2025-10-29 03:50:10'),
(31, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 04:01:39', '2025-10-29 04:01:55'),
(32, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 04:03:26', '2025-10-29 04:03:44'),
(33, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 04:33:07', '2025-10-29 04:33:18'),
(34, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 04:34:23', '2025-10-29 04:34:38'),
(35, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 04:40:18', '2025-10-29 04:48:54'),
(36, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 04:50:53', '2025-10-29 04:51:16'),
(37, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 04:56:19', '2025-10-29 04:56:44'),
(38, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 05:00:38', '2025-10-29 05:01:46'),
(39, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 05:02:01', '2025-10-29 05:03:49'),
(40, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 05:05:13', '2025-10-29 05:09:35'),
(41, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 05:09:02', '2025-10-29 05:09:26'),
(42, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 05:23:37', '2025-10-29 05:35:07'),
(43, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 05:36:33', '2025-10-29 05:38:12'),
(44, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 05:38:23', '2025-10-29 05:40:19'),
(45, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 05:40:50', '2025-10-29 06:29:07'),
(46, 7, 11, 'booking', 10.00, 'completed', NULL, NULL, '2025-10-29 06:29:51', '2025-10-29 06:30:37'),
(47, 6, 8, 'booking', 20.00, 'completed', NULL, NULL, '2025-10-29 08:33:33', '2025-10-29 09:08:03'),
(48, 6, 8, 'booking', 20.00, 'rejected', NULL, NULL, '2025-10-29 08:34:45', '2025-10-29 09:07:13'),
(49, 6, 8, 'booking', 20.00, 'rejected', NULL, NULL, '2025-10-29 08:40:47', '2025-10-29 09:07:11'),
(50, 6, 8, 'booking', 20.00, 'rejected', NULL, NULL, '2025-10-29 08:41:33', '2025-10-29 09:07:08'),
(51, 6, 8, 'booking', 20.00, 'rejected', NULL, NULL, '2025-10-29 08:48:19', '2025-10-29 09:07:06'),
(52, 6, 8, 'booking', 20.00, 'rejected', NULL, NULL, '2025-10-29 08:54:50', '2025-10-29 09:07:03');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `course` varchar(255) DEFAULT NULL,
  `year` varchar(50) DEFAULT NULL,
  `role` varchar(50) NOT NULL,
  `student_id_file` varchar(255) DEFAULT NULL,
  `study_load_file` varchar(255) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `verified` tinyint(1) DEFAULT 0,
  `verification_status` varchar(50) DEFAULT 'pending',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `course`, `year`, `role`, `student_id_file`, `study_load_file`, `profile_image`, `verified`, `verification_status`, `reset_token`, `reset_token_expires`, `created_at`, `updated_at`) VALUES
(5, 'Alexus Sagaral', 'alex@gmail.com', '$2a$10$HtxI0.J0PQQ.tjgnzI1EyeC8zKvu5Q1Tuu2pBNE3H0oDIbuElwVhy', 'BSIT', '2', 'Tutor', '/uploads/1759246422853-664456215.jpg', '/uploads/1759246422855-549247028.jpg', NULL, 1, 'approved', NULL, NULL, '2025-09-30 15:33:42', '2025-09-30 15:39:38'),
(6, 'Jeff Monreal', 'jeff@email.com', '$2a$10$g/f5yo.4rXfWxF6.Lpe8J.wmQ29Wj8XJyU5veJV7QzVtN7P/kek2a', 'BSIT', '2', 'Learner', '/uploads/1759246471164-210728058.jpg', '/uploads/1759246471165-940254723.jpg', NULL, 1, 'approved', NULL, NULL, '2025-09-30 15:34:31', '2025-09-30 15:38:03'),
(7, 'Mark Dave Catubigs', 'mark@email.com', '$2a$10$l01O4W36mDCuHvnI2gCcNO32RAoZo3EneviVmtVKNn755j3fj.Z8y', 'BSIT', '4', 'Both', '/uploads/1759246942236-842248708.jpg', '/uploads/1759246942236-760000021.jpg', NULL, 1, 'approved', NULL, NULL, '2025-09-30 15:42:22', '2025-10-01 03:23:19'),
(8, 'john palacio', 'real@gmail.com', '$2a$10$No8ptRMpLbMYJgRA3cUQA.UA/A38XhBXoq.KNOFiiELYe.bcb3a2q', 'BSIT', '4', 'Both', '/uploads/1763147786067-877529146.jpg', '/uploads/1763147786088-824334118.jpg', NULL, 1, 'approved', NULL, NULL, '2025-11-14 19:16:26', '2025-11-14 19:18:17');

-- --------------------------------------------------------

--
-- Table structure for table `wallet`
--

CREATE TABLE `wallet` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `balance` decimal(10,2) DEFAULT 50.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wallet`
--

INSERT INTO `wallet` (`id`, `user_id`, `balance`, `created_at`, `updated_at`) VALUES
(5, 6, 98.00, '2025-10-27 22:51:57', '2025-10-29 09:08:03'),
(6, 7, 110.00, '2025-10-27 23:05:23', '2025-10-29 09:08:03'),
(7, 5, 290.00, '2025-10-28 02:18:56', '2025-10-29 06:30:37');

-- --------------------------------------------------------

--
-- Table structure for table `wallet_requests`
--

CREATE TABLE `wallet_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('top-up','cash-out') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reference_number` varchar(100) NOT NULL,
  `proof_image` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected','completed') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wallet_requests`
--

INSERT INTO `wallet_requests` (`id`, `user_id`, `type`, `amount`, `reference_number`, `proof_image`, `status`, `created_at`, `updated_at`) VALUES
(1, 6, 'top-up', 50.00, 'gc-123456789', '1761605564153-474995001.jpg', 'approved', '2025-10-27 22:52:44', '2025-10-27 23:27:57'),
(2, 6, 'cash-out', 20.00, '09231576305', NULL, 'completed', '2025-10-27 22:59:08', '2025-10-27 23:28:05'),
(3, 6, 'cash-out', 10.00, '09231576305', NULL, 'completed', '2025-10-28 00:00:25', '2025-10-28 00:01:11'),
(4, 6, 'top-up', 48.00, 'gc-123456789', '1761609703232-717111595.jpg', 'approved', '2025-10-28 00:01:43', '2025-10-28 00:09:45'),
(5, 6, 'cash-out', 20.00, '09231576305', NULL, 'completed', '2025-10-28 00:08:46', '2025-10-28 00:09:37'),
(6, 7, 'top-up', 30.00, 'gc-123456789', '1761610234328-150672736.jpg', 'approved', '2025-10-28 00:10:34', '2025-10-28 00:32:31'),
(7, 7, 'cash-out', 60.00, '09231576305', NULL, 'completed', '2025-10-28 00:33:00', '2025-10-28 00:33:13'),
(8, 7, 'top-up', 160.00, 'gc-123456789', '1761611789796-365626192.png', 'approved', '2025-10-28 00:36:29', '2025-10-28 00:36:38'),
(9, 7, 'cash-out', 50.00, '09231576305', NULL, 'completed', '2025-10-28 00:45:03', '2025-10-28 00:49:13'),
(10, 6, 'top-up', 100.00, 'gc-123456789', '1761691879115-264372279.jpg', 'approved', '2025-10-28 22:51:19', '2025-10-28 22:51:37'),
(11, 6, 'top-up', 120.00, 'gc-123465789', '1761708646278-398553887.jpg', 'approved', '2025-10-29 03:30:46', '2025-10-29 03:31:07');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_admin_email` (`email`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`),
  ADD KEY `created_at` (`created_at`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_reported_user` (`reported_user_id`),
  ADD KEY `idx_reporter` (`reporter_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `saved_services`
--
ALTER TABLE `saved_services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_service_status` (`status`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `idx_transaction_status` (`status`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_user_email` (`email`),
  ADD KEY `idx_user_verification` (`verification_status`);

--
-- Indexes for table `wallet`
--
ALTER TABLE `wallet`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `wallet_requests`
--
ALTER TABLE `wallet_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=147;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `saved_services`
--
ALTER TABLE `saved_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `wallet`
--
ALTER TABLE `wallet`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `wallet_requests`
--
ALTER TABLE `wallet_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  ADD CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `saved_services`
--
ALTER TABLE `saved_services`
  ADD CONSTRAINT `saved_services_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `saved_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Constraints for table `services`
--
ALTER TABLE `services`
  ADD CONSTRAINT `services_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Constraints for table `wallet`
--
ALTER TABLE `wallet`
  ADD CONSTRAINT `wallet_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `wallet_requests`
--
ALTER TABLE `wallet_requests`
  ADD CONSTRAINT `wallet_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
