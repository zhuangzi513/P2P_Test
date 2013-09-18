#include <string>
#include <netinet/in.h>
#include <sys/types.h>

class Socket {
  public:
    Socket();
    virtual ~Socket() { };
    int init(int port);
    int connectTo(std::string serverIP, int port);
    int abort();
    int pull();
    int push(void* data, int len);

  private:
    int  mClientSocket;
    static void* mBuffer;
    struct sockaddr_in mServerAddr;
    struct sockaddr_in mClientAddr;
};
