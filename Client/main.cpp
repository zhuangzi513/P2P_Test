#include "ClientSocket.h"
#include <stdio.h>
#include <string.h>

int main() {
    char buffer[100] = "Ask for reply";
    int dataLen = 100;
    ClientSocket localSocket;
    localSocket.init();
    localSocket.connectToServer();
    //localSocket.sendDataToServer(buffer, dataLen);
    memset(buffer, 0, 100);
    localSocket.recvDataFromServer(buffer, dataLen);
    printf("RECV :%s", buffer);
    return 1;
}
