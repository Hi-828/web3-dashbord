import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout'
import { Navbar } from '../components/layout/navbar'
import { NetworkDetail } from '../components/NetworkDetail';
import { SendTrasaction } from '../components/SendTransaction';
import { MetamaskNetwork } from '../interfaces/networks/network.interface';
import { TokenInfo } from '../interfaces/token/token.interface';
import { connectToMetamask, disconnectWallet, getChainInfo, getChainInfoById, getNetworkBalance, getTokenInfo, getWalletAddress, getWalletTokens, web3 } from '../services/metamask.service';
import { addAddress, removeAddress } from '../store/reducers/address.reducer';
import { addNetwork, updateNetwork } from '../store/reducers/networks.reducer';

const IndexPage = () => {
  const networks: MetamaskNetwork[] = useSelector((state: any) => state.networks);
  const address: string = useSelector((state: any) => state.address);
  const customTokens: TokenInfo[] = useSelector((state: any) => state["custom-tokens"]);
  const [network, setNetwork] = useState(undefined);
  const [isLoading, setLoading] = useState(networks.map(net => { return { status: false, chainId: net.chainId } }))

  const dispatch = useDispatch();

  useEffect(() => {
    const getToken = async () => {
      await connectToMetamask();

      dispatch(addAddress(await getWalletAddress()));

      const chainInfo = getChainInfo();
      const { balance } = await getNetworkBalance();

      setNetwork({ balance, chainInfo });
      dispatch(addNetwork({ tokens: [], balance: balance, name: chainInfo.name, nativeCurrency: chainInfo.nativeCurrency, chainId: chainInfo.chainId }));

      const { ethereum } = window;

      /* ethereum.on('disconnect', (error) => {
        dispatch(removeAddress());
      }); */

      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length < 1) {
          setNetwork(undefined);
          dispatch(removeAddress());
          disconnectWallet()

          return;
        }
      });

      ethereum.on('chainChanged', async (chainId: string) => {
        if (!web3) return;

        const chainInfo = getChainInfoById(web3.utils.hexToNumber(chainId));
        const { balance } = await getNetworkBalance();

        const chainLoading = { status: false, chainId: Number(chainId) }

        const index = isLoading.indexOf(chainLoading);

        if (index === -1) {
          isLoading.push(chainLoading);
        }

        setLoading(isLoading
          .map(net => {
            if (Number(net.chainId) === Number(chainId)) { 
              net.status = true;
            }

            return net;
          })
        );

        dispatch(addNetwork({ tokens: [], balance: balance, name: chainInfo.name, nativeCurrency: chainInfo.nativeCurrency, chainId: chainInfo.chainId }));

        const tokens = await getWalletTokens(customTokens);

        setLoading(isLoading
          .map(net => {
            if (Number(net.chainId) === Number(chainId)) { 
              net.status = false; 
            }

            return net;
          })
        );

        dispatch(updateNetwork({ tokens: tokens, balance: balance, name: chainInfo.name, nativeCurrency: chainInfo.nativeCurrency, chainId: chainInfo.chainId }));
      });
    }

    getToken();
  }, [])

  useEffect(() => {
    setConnectionValues();
  }, [address])
  
  const setConnectionValues = async () => {
    const chainInfo = getChainInfo();
    const { balance } = await getNetworkBalance();

    if (balance === 0) return;

    setNetwork({ balance, chainInfo });
  }

  const connect = async () => {
    await connectToMetamask();
    dispatch(addAddress(await getWalletAddress()));
}

  return (
    <Layout title="Home | Next.js + TypeScript Example">
      <div className='container mx-auto relative z-10'>
        <h2 className="text-7xl font-bold my-12">Network list</h2>
        {
          network && networks && isLoading.length > 0 ?
            networks.map((network: MetamaskNetwork, index) =>
              (
                <div className='mb-20'>
                  <NetworkDetail network={network} loading={isLoading[index]?.status} tokens={[{ balance: network.balance, symbol: network.nativeCurrency.symbol, decimals: "18" }, ...network.tokens]} />
                </div>
              )
            )
            : <div className="flex flex-col w-full m-auto items-center p-12 border-teal-500 border-solid border-2 rounded-3xl">
                <h3 className="text-3xl mb-8 font-light">Connect to load all your networks</h3>
                <button className="app-btn rounded-lg py-3 px-10 border-transparent shadow-lg" onClick={connect}>
                  <strong className="text-5xl">Connect</strong>
                </button>
              </div>
        }
        {
          network ?
            <SendTrasaction />
          : null
        }
      </div>
    </Layout>
  )
}

export default IndexPage
