#include "Socket.h"

#include <arpa/inet.h>
#include <string.h>
#include <stdlib.h>
#include <sys/socket.h>

#define BUFFER_SIZE 256

void* Socket::mBuffer = NULL;

Socket::Socket()
        : mClientSocket(-1) {
    bzero(&mServerAddr, sizeof(mServerAddr));
    bzero(&mClientAddr, sizeof(mClientAddr));
}

int Socket::init(int port) {
    //internet protocol
    mClientAddr.sin_family = AF_INET;
    //get local ip autoicly
    mClientAddr.sin_addr.s_addr = htons(INADDR_ANY);
    //accept any idle port from system
    mClientAddr.sin_port = htons(0);
    mClientSocket = socket(PF_INET, SOCK_STREAM, 0);
    if (mClientSocket < 0) {
        //LOGERR
        return -1;
    }

    int ret = bind(mClientSocket, (struct sockaddr*)&mClientAddr, sizeof(mClientAddr));
    if (ret) {
        //LOGERR
        return -1;
    }
    return 1;
}

int Socket::connectTo(std::string serverIP, int port) {
    mServerAddr.sin_family = AF_INET;
    int ret = inet_aton(serverIP.c_str(), &mServerAddr.sin_addr);
    if (ret == 0) {
        //LOGERR
        return -1;
    }

    mServerAddr.sin_port = htons(port);
    ret = connect(mClientSocket, (struct sockaddr*)&mServerAddr, sizeof(mServerAddr));
    if (ret < 0) {
        //LOGERR
        return -1;
    }
    return 1;
}

int Socket::abort() {
}

int Socket::pull() {
    int ret = recv(mClientSocket, mBuffer, BUFFER_SIZE, 0);
    if (ret < 0) {
        //LOGERR
        return -1;
    }
    return 1;
}

int Socket::push(void* data, int len) {
    int ret = send(mClientSocket, data, len, 0);
    if (ret != len) {
        //LOGERR
        return -1;
    }
}
