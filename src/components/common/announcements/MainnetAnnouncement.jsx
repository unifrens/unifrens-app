import { Rocket } from 'lucide-react';
import Announcement from '../Announcement';

const MainnetAnnouncement = () => (
  <Announcement
    title="🚀 Launching on Unichain Mainnet Soon"
    summary="🚀 Mainnet Launch: Early Testers Get Priority"
    content="Thank you for participating in our testnet phase! As promised, early testers will get priority minting on launch. Minting will be capped at weight 1-10, vs. 100, with max weight remaining at 1000. For more information and to register your address, join our X community @unichainfrens or email meetunifrens [at] gmail [dot] com"
    icon={
      <Rocket 
        size={20}
        color="#F50DB4"
        strokeWidth={2}
      />
    }
  />
);

export default MainnetAnnouncement; 