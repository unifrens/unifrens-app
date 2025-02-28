import { Box, Button } from '@mui/material';
import Announcement from '../Announcement';
import { buttonStyles } from '../../../styles/theme';
import frenTokenImage from '../../../assets/fren-token.png';

const AirdropAnnouncement = ({ estimatedReward }) => (
  <Announcement
    title="💎 Earn $FREN tokens based on your activity"
    summary="💎 $FREN Airdrop: Check Eligibility"
    content={`Your estimated reward is ${estimatedReward} $FREN based on your participation.`}
    icon={
      <Box
        component="img"
        src={frenTokenImage}
        alt="FREN Token"
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: '1px solid rgba(245, 13, 180, 0.1)',
          padding: '2px',
          backgroundColor: 'white'
        }}
      />
    }
    action={
      <Button
        variant="contained"
        disabled
        sx={{
          ...buttonStyles,
          alignSelf: { xs: 'stretch', sm: 'auto' },
          minWidth: { sm: '160px' }
        }}
      >
        Claim Soon
      </Button>
    }
  />
);

export default AirdropAnnouncement; 