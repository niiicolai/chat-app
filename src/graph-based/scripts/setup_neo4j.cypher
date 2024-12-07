
CREATE CONSTRAINT unique_user_username IF NOT EXISTS FOR (u:User) REQUIRE u.username IS UNIQUE;
CREATE CONSTRAINT unique_user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE;
CREATE CONSTRAINT unique_room_name IF NOT EXISTS FOR (r:Room) REQUIRE r.name IS UNIQUE;


