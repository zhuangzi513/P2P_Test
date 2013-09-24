#include <netinet/in.h>
#include <sys/socket.h>
#include <netinet/in.h>

class SeverSocket {
  public:
    SeverSocket();
    ~SeverSocket();
    int sendDataToClient(void* dataToSend, int dataLen);
    int recvDataFromClient(void* dataRecv, int maxLen);
    int init();
    int start();

  private:
    int mSocketId;
    struct sockaddr_in mClientAdded;
    struct sockaddr_in mServerSelf;
};
