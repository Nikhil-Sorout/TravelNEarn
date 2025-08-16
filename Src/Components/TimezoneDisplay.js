import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getTimezoneDisplay } from '../Utils/timezoneUtils';
import { scale, verticalScale, responsiveFontSize } from '../Utils/responsive';

const TimezoneDisplay = ({ style }) => {
  const timezoneInfo = getTimezoneDisplay();
  
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.timezoneText}>
        Your timezone: {timezoneInfo}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    backgroundColor: '#f0f0f0',
    borderRadius: scale(5),
    marginVertical: verticalScale(5),
  },
  timezoneText: {
    fontSize: responsiveFontSize.sm,
    color: '#666',
    textAlign: 'center',
  },
});

export default TimezoneDisplay;
