import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  leftIcon?: React.ReactNode | string;
  rightIcon?: React.ReactNode | string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  textStyle?: any;
  iconStyle?: any;
  loadingColor?: string;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  leftIcon,
  rightIcon,
  loading = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  iconStyle,
  loadingColor,
  children,
  disabled,
  ...touchableOpacityProps
}) => {
  const renderIcon = (icon: React.ReactNode | string, position: 'left' | 'right') => {
    if (typeof icon === 'string') {
      return (
        <Text style={[styles.iconText, iconStyle, position === 'left' ? styles.leftIconText : styles.rightIconText]}>
          {icon}
        </Text>
      );
    }
    return (
      <View style={[styles.iconContainer, position === 'left' ? styles.leftIcon : styles.rightIcon, iconStyle]}>
        {icon}
      </View>
    );
  };

  const getButtonStyle = () => {
    let baseStyle: any[] = [styles.button, styles[`${size}Button` as keyof typeof styles], styles[`${variant}Button` as keyof typeof styles]];

    if (disabled || loading) {
      baseStyle.push(styles.disabledButton);
      if (variant === 'primary') baseStyle.push(styles.primaryDisabled);
      if (variant === 'secondary') baseStyle.push(styles.secondaryDisabled);
      if (variant === 'outline') baseStyle.push(styles.outlineDisabled);
    }

    return [...baseStyle, style];
  };

  const getTextStyle = () => {
    return [styles.buttonText, styles[`${variant}Text` as keyof typeof styles], styles[`${size}Text` as keyof typeof styles], textStyle];
  };

  const defaultLoadingColor = variant === 'primary' ? '#fff' : variant === 'outline' ? '#FF6B35' : '#666';

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      disabled={disabled || loading}
      {...touchableOpacityProps}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={loadingColor || defaultLoadingColor} />
        ) : (
          <>
            {leftIcon && renderIcon(leftIcon, 'left')}
            {children ? (
              children
            ) : title ? (
              <Text style={getTextStyle()}>{title}</Text>
            ) : null}
            {rightIcon && renderIcon(rightIcon, 'right')}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    minWidth: 0,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Size variants
  smallButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  mediumButton: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  largeButton: {
    height: 56,
    paddingHorizontal: 32,
    borderRadius: 28,
  },

  // Color variants
  primaryButton: {
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF6B35',
    shadowOpacity: 0,
    elevation: 0,
  },

  // Disabled states
  disabledButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryDisabled: {
    backgroundColor: '#ccc',
  },
  secondaryDisabled: {
    backgroundColor: '#f0f0f0',
  },
  outlineDisabled: {
    borderColor: '#ccc',
  },

  // Text styles
  buttonText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  // Text color variants
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#1a1a1a',
  },
  outlineText: {
    color: '#FF6B35',
  },

  // Icon styles
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  iconText: {
    fontSize: 16,
  },
  leftIconText: {
    marginRight: 8,
  },
  rightIconText: {
    marginLeft: 8,
  },
});

export default Button;
