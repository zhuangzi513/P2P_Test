#include "ServerSocket.h" 

#include <string.h>
#include <stdio.h>
#include <unistd.h>

#include "defines.h"

SeverSocket::SeverSocket() {
}

SeverSocket::~SeverSocket() {
}

int SeverSocket::sendDataToClient(void* dataToSend, int dataLen) {
    int ret = send(mSocketId, dataToSend, dataLen, 0);
    if (ret == -1) {
        return FAIL;
    }
    return ret;
}

int SeverSocket::recvDataFromClient(void* dataRecv, int maxLen) {
    int dataLen = read(mSocketId, dataRecv, maxLen);
    if (dataLen == -1) {
        return FAIL;
    }
    return dataLen;
}

int SeverSocket::init() {
    mSocketId = socket(AF_INET, SOCK_STREAM, 0);
    if ( -1 == mSocketId) {
        return  FAIL;
    }
    bzero(&mServerSelf, sizeof(mServerSelf));
    mServerSelf.sin_family = AF_INET;
    mServerSelf.sin_addr.s_addr = htonl(INADDR_ANY);
    mServerSelf.sin_port = htons(SERVER_PORT);
    return SUCCESS;
}

int SeverSocket::start() {
    char buffer[100] = {0};
    int len = 100;
    socklen_t sin_size = sizeof(mServerSelf); 
    int ret = bind(mSocketId, (struct sockaddr*)(&mServerSelf), sizeof(mServerSelf));
    if (ret == -1) {
        return FAIL;
    }
    ret = listen(mSocketId, MAX_TIME_OUT);
    if (ret == -1) {
        return FAIL;
    }
    ret = accept(mSocketId, (struct sockaddr*)(&mClientAdded), &sin_size);
    if (ret == -1) {
        return FAIL;
    }
    printf("Server get connect from %#x : %#x\r\n",ntohl(mClientAdded.sin_addr.s_addr),ntohs(mClientAdded.sin_port));
    memcpy(buffer, "You have been recved", 100);
    //sendDataToClient(buffer, len);
    memset(buffer, 0, 100);
    //recvDataFromClient(buffer, len);
    printf("Recv: %s", buffer);
    memcpy(buffer, "Reply to client", 100);
    //sendDataToClient(buffer, len);
    return SUCCESS;
}
