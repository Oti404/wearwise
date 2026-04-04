import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';

interface NavLinkProps {
  to: string; // Numele rutei din stack-ul de navigare
  children: React.ReactNode;
  className?: ViewStyle;        // Stilul de bază
  activeClassName?: ViewStyle;  // Stilul când ruta e activă
  textStyle?: TextStyle;        // Stilul textului
  activeTextStyle?: TextStyle;  // Stilul textuluyi când e activ
}

export const NavLink = ({ 
  to, 
  children, 
  className, 
  activeClassName, 
  textStyle, 
  activeTextStyle 
}: NavLinkProps) => {
  const navigation = useNavigation<any>();
  
  // Obținem numele rutei curente pentru a verifica dacă este "active"
  const activeRouteName = useNavigationState((state) => 
    state?.routes[state.index]?.name
  );

  const isActive = activeRouteName === to;

  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate(to)}
      style={[
        styles.baseButton,
        className,
        isActive && activeClassName
      ]}
      activeOpacity={0.7}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.baseText, textStyle, isActive && activeTextStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B2B2B',
  },
});