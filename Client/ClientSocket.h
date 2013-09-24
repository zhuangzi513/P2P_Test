#include <netinet/in.h>
#include <sys/types.h>
#include <sys/socket.h>

class ClientSocket {
  public:
    ClientSocket();
    ~ClientSocket();

    int init();
    int connectToServer();
    int recvDataFromServer(void* recvedData, int dataLen);
    int sendDataToServer(void* dataToSend, int dataLen);

  private:
    int mSocketId;
    struct sockaddr_in mServerAddr;
    struct sockaddr_in mSelfAddr;
};
