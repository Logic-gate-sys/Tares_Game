# TARES GAME 

### What Is It All About?
It's all about the fun of wordscrable game, but this time delivered over websocket with real-time capabilities so you can challenge your friends or even complete strangers to a 'fight'. 
Tares delivers the multiplayer capability of word scrable with intuitive UI that aims to help you relax while you have fun playing wordscrable with your friends

- Tares help you polish your spelling and critical thinking & problem solving abilities while you enjoy and beat/be beaten to a fight.

## Technical Diagrams 
The App combines two current microservices, handling user stats, websocket connections and room managements as well as live updates broadcasting. This feature combine with intuitive UI elements help you focus on the game while the engine does the heavy light. 

```mermaid
flowchart TD
    CLIENT["Web Browser"]:::client
    NGINX["Reverse Proxy"]:::gateway

    CLIENT <--> NGINX

    subgraph Backend
        direction LR

        subgraph User_Microservice
            direction LR
            User_APIs["REST API microservice"]:::service
            DB1[("User database")]:::database
            User_APIs <--> DB1
        end

        subgraph Game_Microservice
            direction LR
            Game_Engine["Game engine + WebSocket"]:::service
            DB2[("Game database")]:::database
            Game_Engine <--> DB2
        end

        subgraph Merch_Microservice
            direction LR
            Merch["Merch service (coming soon)"]:::pending
            DB3[("Merch database")]:::database
            Merch <--> DB3
        end
    end

    NGINX <-->|HTTP| User_APIs
    NGINX <-->|WebSocket| Game_Engine
    Game_Microservice <-->|gRPC| User_Microservice
    User_Microservice <-->|gRPC| Merch_Microservice

    classDef client fill:#eaf7ea,stroke:#3a7d44,stroke-width:1.5px
    classDef gateway fill:#f3e8fd,stroke:#7b4fa0,stroke-width:1.5px
    classDef service fill:#e8f0fe,stroke:#4a6fa5,stroke-width:1.5px
    classDef database fill:#fef6e4,stroke:#b08500,stroke-width:1.5px
    classDef pending fill:#f5f5f5,stroke:#888888,stroke-width:1.5px,stroke-dasharray:5 5
```

### The sequence of user Experience: 
- User create account/login via the web client
- User lands in a game lobby where they can create their own rooms online and make them available to others
- Or Request to join and available online room. 
- Once room join request is resolved either 'accpeted' or 'rejected' user may join the room automatically or be kicked out. 
- When user gets in the game room, they're make aware when room owner starts game and receives a 15 seconds counddown time, after which the game starts
- Scramble is generate by server and sent to all connected clients in a room , and each players answers are match with words using a determined criteria to award marks. 
- When user leaves room unexpectedly, they're ejected from game.
- Only Room owner can stop/start/pause game. 

```mermaid
sequenceDiagram
    autonumber
    actor Player as Player Browser
    actor Owner as Room Owner Browser
    participant NGINX as Reverse Proxy
    participant UAPI as REST API microservice
    participant UDB as User database
    participant GE as Game engine + WebSocket
    participant GDB as Game database

    Note over Player,GDB: 1. Account creation and login
    Player->>NGINX: POST /signup or /login
    NGINX->>UAPI: Forward request
    UAPI->>UDB: Create user or verify credentials
    UDB-->>UAPI: User record
    alt Credentials valid
        UAPI-->>NGINX: 200 OK with session token
        NGINX-->>Player: Session token
        Player->>NGINX: WebSocket upgrade with token
        NGINX->>GE: Forward upgrade
        GE->>UAPI: Validate token
        UAPI-->>GE: User identity
        GE-->>Player: Connected to lobby
    else Invalid credentials
        UAPI-->>NGINX: 401 Unauthorized
        NGINX-->>Player: Show error
    end

    Note over Owner,GDB: 2. Room creation in the lobby
    Owner->>NGINX: WebSocket message create_room
    NGINX->>GE: Forward message
    GE->>GDB: Insert room with owner and status open
    GDB-->>GE: room_id
    GE-->>Owner: room_created
    GE-->>Player: Lobby room list updated

    Note over Player,GDB: 3. Join request and owner decision
    Player->>NGINX: WebSocket message join_request room_id
    NGINX->>GE: Forward message
    GE->>GDB: Store pending request
    GE-->>Owner: join_request_received
    alt Owner accepts
        Owner->>NGINX: WebSocket message resolve_request accept
        NGINX->>GE: Forward message
        GE->>GDB: Add player to room members
        GE-->>Player: join_accepted and auto-join room
        GE-->>Owner: member_joined
        GE-->>Player: member_joined
    else Owner rejects
        Owner->>NGINX: WebSocket message resolve_request reject
        NGINX->>GE: Forward message
        GE->>GDB: Mark request rejected
        GE-->>Player: join_rejected and return to lobby
    end

    Note over Owner,GDB: 4. Owner starts game with 15-second countdown
    Owner->>GE: start_game
    GE-->>Owner: Countdown started
    GE-->>Player: Game starting in 15 seconds
    loop Every second until countdown ends
        GE-->>Owner: countdown tick
        GE-->>Player: countdown tick
    end
    GE->>GE: Generate scramble
    GE->>GDB: Save round and scramble
    GE-->>Owner: scramble broadcast
    GE-->>Player: scramble broadcast

    Note over Player,GDB: 5. Answer submission and scoring
    loop Each answer during the round
        Player->>GE: submit_answer word
        GE->>GE: Match word against scramble and apply scoring rule
        GE->>GDB: Record answer and marks
        GE-->>Player: answer_result with marks
        GE-->>Owner: score_update
    end

    Note over Owner,GDB: 6. Owner controls game state
    alt Owner pauses, stops, or starts game
        Owner->>GE: pause_game, stop_game, or resume_game
        GE->>GDB: Update game status
        GE-->>Owner: game_state_changed
        GE-->>Player: game_state_changed
    else Non-owner tries to control game
        Player->>GE: pause_game, stop_game, or start_game
        GE-->>Player: error not_room_owner
    end

    Note over Player,GDB: 7. Unexpected disconnect
    Player--xGE: Connection lost
    GE->>GDB: Remove player from room
    GE->>GE: Eject player from game
    GE-->>Owner: player_left
```

## Demo 


## User install and Testing Guide 



## Contributing 



## Known Issues 


## Buy Me a Coffee


## Quick Start

### Requirements

- Go 1.26.3 or compatible
- PostgreSQL running locally
- A database named `tares_db`

### Database Connection

The server currently opens PostgreSQL with this connection string:

```text
host=localhost user=logic dbname=tares_db port=5433 password=logicgate sslmode=disable
```

Adjust your local database to match that configuration, or update the server code before running.

### Run The Server
