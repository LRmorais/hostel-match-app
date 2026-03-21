import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';

interface TextFieldProps extends TextInputProps {
  label?: string;
  leftIcon?: React.ReactNode | string;
  rightIcon?: React.ReactNode | string;
  onRightIconPress?: () => void;
  containerStyle?: any;
  inputWrapperStyle?: any;
  labelStyle?: any;
  inputStyle?: any;
  iconStyle?: any;
  error?: string;
  errorStyle?: any;
}

const TextField = forwardRef<TextInput, TextFieldProps>(
  (
    {
      label,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      inputWrapperStyle,
      labelStyle,
      inputStyle,
      iconStyle,
      error,
      errorStyle,
      ...textInputProps
    },
    ref
  ) => {
    const renderIcon = (icon: React.ReactNode | string, isLeft: boolean = true) => {
      if (typeof icon === 'string') {
        return (
          <View style={[styles.iconContainer, isLeft ? styles.leftIcon : styles.rightIcon, iconStyle]}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
        );
      }
      return (
        <View style={[styles.iconContainer, isLeft ? styles.leftIcon : styles.rightIcon, iconStyle]}>
          {icon}
        </View>
      );
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        )}

        <View style={[styles.inputWrapper, inputWrapperStyle, error && styles.inputWrapperError]}>
          {leftIcon && renderIcon(leftIcon, true)}

          <TextInput
            ref={ref}
            style={[
              styles.textInput,
              leftIcon && styles.textInputWithLeftIcon,
              rightIcon && styles.textInputWithRightIcon,
              inputStyle,
            ]}
            placeholderTextColor="#999"
            {...textInputProps}
          />

          {rightIcon && (
            onRightIconPress ? (
              <TouchableOpacity
                style={[styles.iconContainer, styles.rightIcon, iconStyle]}
                onPress={onRightIconPress}
              >
                {typeof rightIcon === 'string' ? (
                  <Text style={styles.iconText}>{rightIcon}</Text>
                ) : (
                  rightIcon
                )}
              </TouchableOpacity>
            ) : (
              renderIcon(rightIcon, false)
            )
          )}
        </View>

        {error && (
          <Text style={[styles.errorText, errorStyle]}>{error}</Text>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputWrapperError: {
    borderColor: '#ff4444',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
    padding: 8,
  },
  iconText: {
    fontSize: 16,
    color: '#666',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    height: '100%',
  },
  textInputWithLeftIcon: {
    // Já tem marginLeft do leftIcon
  },
  textInputWithRightIcon: {
    // Já tem marginRight do rightIcon
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

TextField.displayName = 'TextField';

export default TextField;
