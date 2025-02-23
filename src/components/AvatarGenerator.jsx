import Avatar from 'boring-avatars';
import PropTypes from 'prop-types';

const AvatarGenerator = ({ 
  size = 40, 
  name = 'Anonymous',
  variant = 'beam',
  colors = ['#F50DB4', '#FEAFF0'],
  square = true
}) => {
  return (
    <Avatar
      size={size}
      name={name}
      variant={variant}
      colors={colors}
      square={square}
    />
  );
};

AvatarGenerator.propTypes = {
  size: PropTypes.number,
  name: PropTypes.string,
  variant: PropTypes.oneOf(['pixel', 'bauhaus', 'ring', 'beam', 'sunset', 'marble']),
  colors: PropTypes.arrayOf(PropTypes.string),
  square: PropTypes.bool
};

export default AvatarGenerator;