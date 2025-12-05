import React from 'react';
import { View, Text } from 'react-native';

const PlaceholderScreen = ({ route }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
    <Text style={{ color: '#000' }}>{route.name}</Text>
  </View>
);

export default PlaceholderScreen;
