CREATE TABLE `cloudInspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`localId` varchar(64) NOT NULL,
	`machineLocalId` varchar(64) NOT NULL,
	`assetId` varchar(128) NOT NULL,
	`makeModel` varchar(255) NOT NULL,
	`date` varchar(32) NOT NULL,
	`timestamp` varchar(64) NOT NULL,
	`operator` varchar(255) NOT NULL,
	`hourMeter` int NOT NULL DEFAULT 0,
	`checks` json NOT NULL,
	`signatureBase64` text NOT NULL,
	`cleared` int NOT NULL DEFAULT 0,
	`location` json,
	`groundedReason` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cloudInspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cloudMachines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`localId` varchar(64) NOT NULL,
	`assetId` varchar(128) NOT NULL,
	`makeModel` varchar(255) NOT NULL,
	`serialNumber` varchar(128) NOT NULL,
	`hourMeter` int NOT NULL DEFAULT 0,
	`status` enum('active','retired','grounded') NOT NULL DEFAULT 'active',
	`machineCreatedAt` varchar(32) NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`deletedAt` timestamp,
	CONSTRAINT `cloudMachines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cloudServiceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`localId` varchar(64) NOT NULL,
	`machineLocalId` varchar(64) NOT NULL,
	`assetId` varchar(128) NOT NULL,
	`date` varchar(32) NOT NULL,
	`serviceType` varchar(64) NOT NULL,
	`description` text NOT NULL,
	`hourMeter` int NOT NULL DEFAULT 0,
	`nextServiceHours` int,
	`technician` varchar(255) NOT NULL,
	`cost` int,
	`notes` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`deletedAt` timestamp,
	CONSTRAINT `cloudServiceRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('trial','active','expired','cancelled') NOT NULL DEFAULT 'trial',
	`platform` enum('ios','android','web') NOT NULL DEFAULT 'web',
	`storeTransactionId` varchar(255),
	`periodStart` timestamp,
	`periodEnd` timestamp,
	`trialEndsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
