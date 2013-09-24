#include "ClientSocket.h"

#include <arpa/inet.h>
#include <string.h>
#include <unistd.h>

#include "defines.h"

#define SERVER_IP "127.0.0.1"

ClientSocket::ClientSocket() {
}

ClientSocket::~ClientSocket() {
}

int ClientSocket::init() {
    mSocketId = socket(AF_INET, SOCK_STREAM, 0);
    if (mSocketId == -1) {
        return FAIL;
    }
    bzero(&mServerAddr, sizeof(mServerAddr));
    mServerAddr.sin_family = AF_INET;
    mServerAddr.sin_addr.s_addr = inet_addr(SERVER_IP);
    mServerAddr.sin_port = htons(SERVER_PORT);
    return SUCCESS;
}

int ClientSocket::connectToServer() {
    int ret = connect(mSocketId, (struct sockaddr*)(&mServerAddr), sizeof(mServerAddr));
    if (ret == -1) {
        return FAIL;
    }
}

int ClientSocket::recvDataFromServer(void* recvedData, int dataLen) {
    int ret = read(mSocketId, recvedData, dataLen);
    if (dataLen == -1) {
        return FAIL;
    }
    return dataLen;
}

int ClientSocket::sendDataToServer(void* dataToSend, int dataLen) {
    int ret = send(mSocketId, dataToSend, dataLen, 0);
    if (dataLen == -1) {
        return FAIL;
    }
    return SUCCESS;
}
