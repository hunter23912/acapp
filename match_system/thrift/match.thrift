namespace py match_service

service Match {
    // channel_name是与game客户端通信的标识符
    i32 add_player(1: i32 score,2: string uuid, 3: string username, 4: string photo, 5: string channel_name)
    
}