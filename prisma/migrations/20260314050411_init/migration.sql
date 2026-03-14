-- CreateTable
CREATE TABLE "Player" (
    "player_id" TEXT NOT NULL,
    "player_fname" TEXT NOT NULL,
    "player_lname" TEXT NOT NULL,
    "player_dob" DATE NOT NULL,
    "player_gender" TEXT NOT NULL,
    "player_skill" INTEGER NOT NULL,
    "player_desc" TEXT,
    "player_lat" DOUBLE PRECISION,
    "player_long" DOUBLE PRECISION,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("player_id")
);

-- CreateTable
CREATE TABLE "Location" (
    "location_id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,
    "location_name" TEXT NOT NULL,
    "location_address" TEXT NOT NULL,
    "location_scrape_link" TEXT,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "Lobby" (
    "lobby_id" TEXT NOT NULL,
    "host_player_id" TEXT NOT NULL,
    "host_level" INTEGER NOT NULL,
    "lobby_desc" TEXT,
    "lobby_match_type" TEXT NOT NULL,
    "lobby_game_type" TEXT NOT NULL,
    "lobby_days" TEXT[],
    "lobby_time" TEXT NOT NULL,
    "lobby_max_players" INTEGER NOT NULL,
    "lobby_status" TEXT NOT NULL DEFAULT 'Open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lobby_pkey" PRIMARY KEY ("lobby_id")
);

-- CreateTable
CREATE TABLE "LobbyPlayer" (
    "lobby_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,

    CONSTRAINT "LobbyPlayer_pkey" PRIMARY KEY ("lobby_id","player_id")
);

-- CreateTable
CREATE TABLE "Match" (
    "match_id" TEXT NOT NULL,
    "lobby_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "court_number" INTEGER,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "match_status" TEXT NOT NULL DEFAULT 'Confirmed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("match_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Match_lobby_id_key" ON "Match"("lobby_id");

-- AddForeignKey
ALTER TABLE "LobbyPlayer" ADD CONSTRAINT "LobbyPlayer_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "Lobby"("lobby_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyPlayer" ADD CONSTRAINT "LobbyPlayer_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "Lobby"("lobby_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;
