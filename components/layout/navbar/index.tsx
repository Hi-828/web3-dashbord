import { useDispatch, useSelector } from "react-redux";
import { ChainNetwork } from "../../../interfaces/networks/network.interface";
import { TokenInfo } from "../../../interfaces/token/token.interface";
import { addNetworkToWallet, addTokenToWallet, connectToMetamask, getWalletAddress, web3 } from "../../../services/metamask.service";
import { addAddress } from "../../../store/reducers/address.reducer";
import { getSimplifiedAddress } from "../../../utils/text";
import { NetworkSearch } from "../../NetworkSearch";
import { TokenInfokSearch } from "../../TokenInfoSearch";
import { networks } from "../../../interfaces/networks/networks";

export const Navbar = ({ title }: any) => {
    const address: string = useSelector((state: any) => state.address);
    const dispatch = useDispatch();

    const connect = async () => {
        await connectToMetamask();
        dispatch(addAddress(await getWalletAddress()));
    }

    const addToken = async (token: TokenInfo) => {
        try {
            if (!window.ethereum) throw new Error("No crypto wallet found");

            await addTokenToWallet(token);
        } catch (err) {
            console.log(err)
            /* setError(err.message); */
        }
    };

    const changeNetwork = async (networkId: number | string) => {
        try {
            if (!window.ethereum) throw new Error("No crypto wallet found");

            const network = networks.find(net => net.chainId === networkId);

            if (!network) {
                console.log("Network doesn't exist")
            }

            const newNetwork: ChainNetwork = {
                chainId: web3.utils.toHex(network.chainId),
                chainName: network.name,
                nativeCurrency: network.nativeCurrency,
                rpcUrls: network.rpc,
                blockExplorerUrls: network.explorers ? network.explorers.map(ex => ex.url) : []
            }

            if (!network.explorers) {
                delete newNetwork.blockExplorerUrls;
            }

            await addNetworkToWallet(newNetwork);
        } catch (err) {
            console.log(err)
            /* setError(err.message); */
        }
    };

    return (
        <div className="p-4 flex justify-between items-center">
            <h2 className="text-5xl font-black">{title}</h2>
            <div className="flex space-x-6 items-center">
                <h3 className="text-xl font-bold">Add Network: </h3>
                <div className="flex flex-col w-80 relative">
                    <NetworkSearch onItemSearch={changeNetwork} />
                </div>
                <h3 className="text-xl font-bold">Add Token: </h3>
                <div className="flex flex-col w-80 relative">
                    <TokenInfokSearch onItemSearch={addToken} />
                </div>
                {/* <button onClick={handleNetworkAdd} className="app-btn rounded-lg py-1 px-8 border-transparent shadow-lg">
                    <strong className="text-2xl">Add</strong>
                </button> */}
                <button onClick={connect} className="app-btn rounded-lg py-1 px-8 border-transparent shadow-lg max-w-xs">
                    {
                        address ?
                            <strong className="text-md">{ getSimplifiedAddress(address) }</strong>
                        :
                            <strong className="text-2xl">Connect</strong>
                    }
                </button>
            </div>
        </div>
    )
}