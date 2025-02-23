import { useParams } from 'react-router-dom';
import Avatar from 'boring-avatars';
import { Box } from '@mui/material';

const AvatarPage = () => {
  const { seed } = useParams();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#FAFAFA'
      }}
    >
      <Avatar
        size={400}
        name={seed}
        variant="beam"
        colors={['#F50DB4', '#FEAFF0']}
        square={true}
      />
    </Box>
  );
};

export default AvatarPage;