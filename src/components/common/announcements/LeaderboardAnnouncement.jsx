import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import Announcement from '../Announcement';
import { buttonStyles } from '../../../styles/theme';
import { Trophy } from 'lucide-react';

const LeaderboardAnnouncement = () => (
  <Announcement
    title="🏆 Compete in the new Leaderboards"
    summary="🏆 New: Leaderboards Live"
    content="Check out where your Frens rank and compete for the top spots."
    icon={
      <Trophy 
        size={20}
        color="#F50DB4"
        strokeWidth={2}
      />
    }
    action={
      <Button
        component={Link}
        to="/leaderboard"
        variant="contained"
        sx={{
          ...buttonStyles,
          alignSelf: { xs: 'stretch', sm: 'auto' },
          minWidth: { sm: '160px' }
        }}
      >
        View Leaderboard
      </Button>
    }
  />
);

export default LeaderboardAnnouncement; 