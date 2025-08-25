
import React, { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  fontScale,
  responsivePadding,
  responsiveFontSize,
  responsiveDimensions,
  screenWidth,
} from '../Utils/responsive';

const verifyDrivingLicense = async (dlNumber, dob, setDlRequestId) => {
  if (!dlNumber || !dob) {
    Alert.alert('Error', 'Please enter both Driving License number and Date of Birth.');
    return null;
  }

  try {
    const API_KEY = '9c2e61dd-23f5-44dd-8237-c0a12c248b1a';
    const ACCOUNT_ID = 'd1591c99d748/6a937975-a93e-4e6e-a5dd-7aa8663f1db2';
    const URL = 'https://eve.idfy.com/v3/tasks/async/verify_with_source/ind_driving_license';

    const data = JSON.stringify({
      task_id: "74f4c926-250c-43ca-9c53-453e87ceacd1",
      group_id: "8e16424a-58fc-4ba4-ab20-5bc8e7c3c41e",
      data: {
        id_number: dlNumber,
        date_of_birth: dob,
        advanced_details: {
          state_info: true,
          age_info: true
        }
      }
    });

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: URL,
      headers: { 
        'Content-Type': 'application/json', 
        'account-id': ACCOUNT_ID, 
        'api-key': API_KEY
      },
      data: data
    };

    const response = await axios(config);

    if (response.data.request_id) {
      setDlRequestId(response.data.request_id);
      Alert.alert('Success', 'Driving License request initiated. Now checking verification status...');
      console.log('DL Request ID:', response.data.request_id);
      return response.data.request_id;
    } else {
      Alert.alert('Error', 'Failed to get request ID for Driving License verification.');
      return null;
    }
  } catch (error) {
    console.error('DL Verification Error:', error.response?.data || error.message);
    Alert.alert('Error', 'Failed to verify Driving License.');
    return null;
  }
};

const verifyPanCard = async (panNumber, fullName, dob, setPanRequestId) => {
  if (!panNumber || !fullName || !dob) {
    Alert.alert('Error', 'Please enter PAN number, Full Name, and Date of Birth.');
    return null;
  }

  try {
    const API_KEY = '9c2e61dd-23f5-44dd-8237-c0a12c248b1a';
    const ACCOUNT_ID = 'd1591c99d748/6a937975-a93e-4e6e-a5dd-7aa8663f1db2';
    const URL = 'https://eve.idfy.com/v3/tasks/async/verify_with_source/ind_pan';

    const data = JSON.stringify({
      task_id: '74f4c926-250c-43ca-9c53-453e87ceacd1',
      group_id: '8e16424a-58fc-4ba4-ab20-5bc8e7c3c41e',
      data: {
        id_number: panNumber,
        full_name: fullName,
        dob: dob,
      },
    });

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: URL,
      headers: {
        'Content-Type': 'application/json',
        'account-id': ACCOUNT_ID,
        'api-key': API_KEY,
      },
      data: data,
    };

    const response = await axios(config);

    if (response.data.request_id) {
      setPanRequestId(response.data.request_id);
      Alert.alert('Success', 'PAN Card request initiated. Now checking verification status...');
      console.log('PAN Request ID:', response.data.request_id);
      return response.data.request_id;
    } else {
      Alert.alert('Error', 'Failed to get request ID for PAN verification.');
      return null;
    }
  } catch (error) {
    console.error('PAN Verification Error:', error.response?.data || error.message);
    Alert.alert('Error', 'Failed to verify PAN card.');
    return null;
  }
};

// Utility function to validate and parse date
const parseDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const updateProfileVerification = async (panName) => {
  try {
    const phoneNumber = await AsyncStorage.getItem('phoneNumber');
    const baseurl = await AsyncStorage.getItem('apiBaseUrl');
    
    if (!phoneNumber || !baseurl) {
      console.error('Phone number or base URL not found');
      return false;
    }

    // Split the PAN name into first and last name
    const nameParts = panName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // First, try to get existing profile data to preserve other fields
    let existingProfileData = {};
    try {
      const existingResponse = await fetch(`${baseurl}api/getall/${phoneNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (existingResponse.ok) {
        const existingData = await existingResponse.json();
        if (existingData && existingData.user) {
          existingProfileData = existingData.user;
          console.log('Existing profile data:', existingProfileData);
        }
      }
    } catch (error) {
      console.log('Could not fetch existing profile data, proceeding with new data');
    }

    const requestData = {
      ...existingProfileData, // Preserve existing profile data
      isVerified: true,
      firstName: firstName,
      lastName: lastName,
      phoneNumber: phoneNumber
    };

    console.log('Updating profile verification with data:', requestData);
    console.log('API URL:', `${baseurl}api/update/${phoneNumber}`);

    const response = await fetch(`${baseurl}api/update/${phoneNumber}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const responseData = await response.json();
    console.log('Profile update response:', responseData);
    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(responseData.message || `Failed to update profile verification. Status: ${response.status}`);
    }

    // Update AsyncStorage with verification status
    await AsyncStorage.setItem('isVerified', 'true');
    await AsyncStorage.setItem('firstName', firstName);
    await AsyncStorage.setItem('lastName', lastName);

    // Verify the update was successful by fetching the updated profile
    try {
      const verifyResponse = await fetch(`${baseurl}api/getall/${phoneNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('Verification - Updated profile data:', verifyData);
        if (verifyData && verifyData.user && verifyData.user.isVerified) {
          console.log('✅ Profile verification successfully updated on backend');
        } else {
          console.log('⚠️ Profile verification may not have been updated on backend');
        }
      }
    } catch (error) {
      console.log('Could not verify profile update on backend:', error);
    }

    Alert.alert('Success', 'Profile verification completed successfully! Your profile has been updated on the backend.');
    return true;
  } catch (error) {
    console.error('Profile update error:', error);
    Alert.alert('Error', 'Failed to update profile verification: ' + error.message);
    return false;
  }
};

const checkVerificationStatus = async (requestId, setVerificationStatus, type, setDetails, attempt = 1, maxAttempts = 30) => {
  if (!requestId) {
    Alert.alert('Error', 'No request ID found. Please verify the document first.');
    return;
  }

  console.log('Checking status for Request ID:', requestId, 'Attempt:', attempt);

  try {
    const API_KEY = '9c2e61dd-23f5-44dd-8237-c0a12c248b1a';
    const ACCOUNT_ID = 'd1591c99d748/6a937975-a93e-4e6e-a5dd-7aa8663f1db2';
    const STATUS_URL = `https://eve.idfy.com/v3/tasks?request_id=${requestId}`;

    const response = await axios.get(STATUS_URL, {
      headers: {
        'api-key': API_KEY,
        'Content-Type': 'application/json',
        'account-id': ACCOUNT_ID,
      },
    });
    console.log('API Response:', response);

    if (response.data && response.data[0] && response.data[0].status) {
      const status = response.data[0].status;
      const result = response.data[0].result?.source_output;
      setVerificationStatus(status);

      if (status === 'completed') {
        if (type === 'ind_pan' && result?.status === 'id_found' && result?.pan_status?.includes('Valid')) {
          const details = {
            panNumber: result.input_details?.input_pan_number || '',
            fullName: result.input_details?.input_name || '',
            dob: result.input_details?.input_dob || '',
          };
          await AsyncStorage.setItem('panStatus', 'completed');
          await AsyncStorage.setItem('panDetails', JSON.stringify(details));
          setDetails(details);
          Alert.alert('Success', 'PAN verification successful! The PAN card is valid and matches the provided details.');
          
          // Check if both verifications are completed
          const dlStatus = await AsyncStorage.getItem('dlStatus');
          if (dlStatus === 'completed') {
            await updateProfileVerification(details.fullName);
          }
        } else if (type === 'ind_driving_license' && result?.status === 'id_found') {
          console.log('DL API Response Result:', JSON.stringify(result));
          
          const details = {
            dlNumber: result.id_number || '',
            dob: result.dob || '',
            name: result.name || '',
          };
          
          console.log('Storing DL Details:', JSON.stringify(details));
          await AsyncStorage.setItem('dlStatus', 'completed');
          await AsyncStorage.setItem('dlDetails', JSON.stringify(details));
          setDetails(details);
          Alert.alert('Success', 'Driving License verification successful! The license is valid and matches the provided details.');
          
          // Check if both verifications are completed
          const panStatus = await AsyncStorage.getItem('panStatus');
          if (panStatus === 'completed') {
            const panDetails = await AsyncStorage.getItem('panDetails');
            if (panDetails) {
              const { fullName: panName } = JSON.parse(panDetails);
              await updateProfileVerification(panName);
            }
          }
        } else {
          Alert.alert('Verification Status', `Verification completed but with issues: ${result?.status || 'Unknown status'}`);
        }
      } else if (status === 'pending') {
        if (attempt >= maxAttempts) {
          Alert.alert('Error', 'Verification is still pending after maximum attempts.');
        } else {
          Alert.alert('Status', `Verification is still pending. Attempt ${attempt} of ${maxAttempts}.`);
          setTimeout(() => checkVerificationStatus(requestId, setVerificationStatus, type, setDetails, attempt + 1, maxAttempts), 2000);
        }
      } else {
        Alert.alert('Verification Status', `Verification Status: ${status}`);
      }
      console.log('Verification Response:', response.data);
    } else {
      Alert.alert('Error', 'Invalid response from verification API.');
    }
  } catch (error) {
    console.error('Status Check Error:', error.response?.data || error.message);
    Alert.alert('Error', 'Failed to check verification status: ' + (error.response?.data?.message || error.message));
  }
};

const verifyDocument = async (dlNumber, dob, panNumber, fullName, setDlRequestId, setPanRequestId, setDlStatus, setPanStatus, setDlDetails, setPanDetails) => {
  const dlStatus = await AsyncStorage.getItem('dlStatus');
  if (dlStatus !== 'completed') {
    const dlRequestId = await verifyDrivingLicense(dlNumber, dob, setDlRequestId);
    if (dlRequestId) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await checkVerificationStatus(dlRequestId, setDlStatus, 'ind_driving_license', setDlDetails);
    }
  }

  const panStatus = await AsyncStorage.getItem('panStatus');
  if (panStatus !== 'completed') {
    const panRequestId = await verifyPanCard(panNumber, fullName, dob, setPanRequestId);
    if (panRequestId) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await checkVerificationStatus(panRequestId, setPanStatus, 'ind_pan', setPanDetails);
    }
  }

  // Check if both verifications are completed and update profile
  const finalDlStatus = await AsyncStorage.getItem('dlStatus');
  const finalPanStatus = await AsyncStorage.getItem('panStatus');
  
  if (finalDlStatus === 'completed' && finalPanStatus === 'completed') {
    const panDetails = await AsyncStorage.getItem('panDetails');
    if (panDetails) {
      const { fullName: panName } = JSON.parse(panDetails);
      await updateProfileVerification(panName);
    }
  }
};

const Dlt = () => {
  const [dlNumber, setDlNumber] = useState('');
  const [dob, setDob] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [dlRequestId, setDlRequestId] = useState('');
  const [panRequestId, setPanRequestId] = useState('');
  const [dlStatus, setDlStatus] = useState('');
  const [panStatus, setPanStatus] = useState('');
  const [statusCheckType, setStatusCheckType] = useState('dl');
  const [isDlVerified, setIsDlVerified] = useState(false);
  const [isPanVerified, setIsPanVerified] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDl, setShowDl] = useState(false);
  const [showPan, setShowPan] = useState(false);

  useEffect(() => {
    const loadVerificationStatus = async () => {
      try {
        // await AsyncStorage.setItem("dlStatus", "pending")
        // await AsyncStorage.setItem("panStatus", "pending")
        const dlStatus = await AsyncStorage.getItem('dlStatus');
        const panStatus = await AsyncStorage.getItem('panStatus');
        const dlDetails = await AsyncStorage.getItem('dlDetails');
        const panDetails = await AsyncStorage.getItem('panDetails');
        const globalVerificationStatus = await AsyncStorage.getItem('isVerified');
        console.log(dlStatus, panStatus, dlDetails, panDetails, globalVerificationStatus)
        if (dlStatus === 'completed' && dlDetails) {
          console.log('Loading DL Details from AsyncStorage:', dlDetails);
          const { dlNumber, dob, name } = JSON.parse(dlDetails);
          console.log('Parsed DL Details:', { dlNumber, dob, name });
          setDlStatus('completed');
          setIsDlVerified(true);
          setDlNumber(dlNumber || '');
          setDob(dob || '');
          const parsedDate = parseDate(dob);
          if (parsedDate) {
            setDate(parsedDate);
          }
        }
        if (panStatus === 'completed' && panDetails) {
          const { panNumber, fullName, dob } = JSON.parse(panDetails);
          setPanStatus('completed');
          setIsPanVerified(true);
          setPanNumber(panNumber || '');
          setFullName(fullName || '');
          setDob(dob || '');
          const parsedDate = parseDate(dob);
          if (parsedDate) {
            setDate(parsedDate);
          }
        }

        // Check if both documents are verified but profile is not updated
        if (dlStatus === 'completed' && panStatus === 'completed' && globalVerificationStatus !== 'true') {
          if (panDetails) {
            const { fullName: panName } = JSON.parse(panDetails);
            await updateProfileVerification(panName);
          }
        }
      } catch (error) {
        console.error('Error loading verification status:', error);
        Alert.alert('Error', 'Failed to load verification status.');
      }
    };
    loadVerificationStatus();
  }, []);

  const handleDateChange = (event, selectedDate, type) => {
    if (type === 'dl') {
      setShowDl(Platform.OS === 'android' ? false : showDl);
    } else {
      setShowPan(Platform.OS === 'android' ? false : showPan);
    }
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      setDob(formattedDate);
      if (Platform.OS === 'ios') {
        // For iOS, manually hide the picker after selection
        if (type === 'dl') {
          setShowDl(false);
        } else {
          setShowPan(false);
        }
      }
    }
  };

  const setDlDetails = (details) => {
    setDlNumber(details.dlNumber || '');
    setDob(details.dob || '');
    const parsedDate = parseDate(details.dob);
    setDate(parsedDate || new Date());
    setIsDlVerified(true);
  };

  const setPanDetails = (details) => {
    setPanNumber(details.panNumber || '');
    setFullName(details.fullName || '');
    setDob(details.dob || '');
    const parsedDate = parseDate(details.dob);
    setDate(parsedDate || new Date());
    setIsPanVerified(true);
  };

  const handleVerifyDrivingLicense = () => {
    if (!isDlVerified) {
      verifyDrivingLicense(dlNumber, dob, setDlRequestId);
    } else {
      Alert.alert('Info', 'Driving License is already verified and cannot be modified.');
    }
  };

  const handleVerifyPanCard = () => {
    if (!isPanVerified) {
      verifyPanCard(panNumber, fullName, dob, setPanRequestId);
    } else {
      Alert.alert('Info', 'PAN Card is already verified and cannot be modified.');
    }
  };

  const handleCheckStatus = () => {
    if (statusCheckType === 'dl' && isDlVerified) {
      Alert.alert('Info', 'Driving License is already verified.');
    } else if (statusCheckType === 'pan' && isPanVerified) {
      Alert.alert('Info', 'PAN Card is already verified.');
    } else {
      checkVerificationStatus(
        statusCheckType === 'dl' ? dlRequestId : panRequestId,
        statusCheckType === 'dl' ? setDlStatus : setPanStatus,
        statusCheckType === 'dl' ? 'ind_driving_license' : 'ind_pan',
        statusCheckType === 'dl' ? setDlDetails : setPanDetails
      );
    }
  };

  const handleVerifyAll = () => {
    if (isDlVerified && isPanVerified) {
      Alert.alert('Info', 'All documents are already verified.');
    } else {
      verifyDocument(
        dlNumber,
        dob,
        panNumber,
        fullName,
        setDlRequestId,
        setPanRequestId,
        setDlStatus,
        setPanStatus,
        setDlDetails,
        setPanDetails
      );
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.header}>Profile Verification (KYC)</Text>
        <Text style={styles.subtitle}>VERIFY YOUR PROFILE IN 3 EASY STEPS</Text>

        {/* Driving License Verification */}
        <Text style={styles.sectionTitle}>Driving License</Text>
        <TextInput
          style={[styles.input, isDlVerified && styles.disabledInput]}
          placeholder="Enter Driving License Number"
          placeholderTextColor="#666"
          value={dlNumber}
          onChangeText={setDlNumber}
          editable={!isDlVerified}
        />
        <TouchableOpacity
          style={[styles.input, styles.dateButton, isDlVerified && styles.disabledInput]}
          onPress={() => !isDlVerified && setShowDl(true)}
          disabled={isDlVerified}
        >
          <Text style={styles.dateText}>{dob || 'Select Date of Birth (YYYY-MM-DD)'}</Text>
        </TouchableOpacity>
        {showDl && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(event, selectedDate) => handleDateChange(event, selectedDate, 'dl')}
          />
        )}
        <TouchableOpacity
          style={[styles.button, isDlVerified && styles.disabledButton]}
          onPress={handleVerifyDrivingLicense}
          disabled={isDlVerified}
        >
          <Text style={styles.buttonText}>Verify Driving License</Text>
        </TouchableOpacity>
        {dlRequestId && <Text style={styles.statusText}>DL Request ID: {dlRequestId}</Text>}
        {dlStatus && (
          <Text
            style={[
              styles.statusText,
              dlStatus === 'completed' ? styles.successText : styles.pendingText,
            ]}
          >
            DL Status: {dlStatus === 'completed' ? 'Verification Successful' : dlStatus}
          </Text>
        )}

        {/* PAN Card Verification */}
        <Text style={styles.sectionTitle}>PAN Card</Text>
        <TextInput
          style={[styles.input, isPanVerified && styles.disabledInput]}
          placeholder="Enter PAN Number"
          placeholderTextColor="#666"
          value={panNumber}
          onChangeText={setPanNumber}
          editable={!isPanVerified}
        />
        <TextInput
          style={[styles.input, isPanVerified && styles.disabledInput]}
          placeholder="Enter Full Name as per PAN"
          placeholderTextColor="#666"
          value={fullName}
          onChangeText={setFullName}
          editable={!isPanVerified}
        />
        <TouchableOpacity
          style={[styles.input, styles.dateButton, isPanVerified && styles.disabledInput]}
          onPress={() => !isPanVerified && setShowPan(true)}
          disabled={isPanVerified}
        >
          <Text style={styles.dateText}>{dob || 'Select Date of Birth (YYYY-MM-DD)'}</Text>
        </TouchableOpacity>
        {showPan && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(event, selectedDate) => handleDateChange(event, selectedDate, 'pan')}
          />
        )}
        <TouchableOpacity
          style={[styles.button, isPanVerified && styles.disabledButton]}
          onPress={handleVerifyPanCard}
          disabled={isPanVerified}
        >
          <Text style={styles.buttonText}>Verify PAN Card</Text>
        </TouchableOpacity>
        {panRequestId && <Text style={styles.statusText}>PAN Request ID: {panRequestId}</Text>}
        {panStatus && (
          <Text
            style={[
              styles.statusText,
              panStatus === 'completed' ? styles.successText : styles.pendingText,
            ]}
          >
            PAN Status: {panStatus === 'completed' ? 'Verification Successful' : panStatus}
          </Text>
        )}

        {/* Check Verification Status */}
        <Text style={styles.sectionTitle}>Check Verification Status</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={[styles.radioButton, statusCheckType === 'dl' ? styles.radioSelected : {}]}
            onPress={() => setStatusCheckType('dl')}
          >
            <Text style={styles.radioText}>Driving License</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioButton, statusCheckType === 'pan' ? styles.radioSelected : {}]}
            onPress={() => setStatusCheckType('pan')}
          >
            <Text style={styles.radioText}>PAN Card</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleCheckStatus}>
          <Text style={styles.buttonText}>Check Status</Text>
        </TouchableOpacity>

        {/* Verify All Documents */}
        <TouchableOpacity
          style={[styles.button, isDlVerified && isPanVerified && styles.disabledButton]}
          onPress={handleVerifyAll}
          disabled={isDlVerified && isPanVerified}
        >
          <Text style={styles.buttonText}>Verify All Documents</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: 15
  },
  container: {
    flex: 1,
    paddingHorizontal: responsivePadding.horizontal,
    paddingVertical: responsivePadding.vertical,
    backgroundColor: '#f9f9f9',
    minHeight: '100%',
  },
  header: {
    fontSize: responsiveFontSize.xxl,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: moderateVerticalScale(10),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: responsiveFontSize.md,
    color: '#000000',
    marginBottom: moderateVerticalScale(20),
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: responsiveFontSize.lg,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: moderateVerticalScale(20),
    marginBottom: moderateVerticalScale(10),
  },
  input: {
    width: '100%',
    height: moderateVerticalScale(50),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: moderateScale(5),
    paddingHorizontal: moderateScale(10),
    marginBottom: moderateVerticalScale(15),
    backgroundColor: '#fff',
    fontSize: responsiveFontSize.md,
    color: '#000000',
  },
  dateButton: {
    justifyContent: 'center',
  },
  dateText: {
    color: '#000000',
    fontSize: responsiveFontSize.md,
  },
  disabledInput: {
    backgroundColor: '#e9ecef',
    opacity: 0.6,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: moderateVerticalScale(15),
    borderRadius: moderateScale(5),
    marginVertical: moderateVerticalScale(10),
    alignItems: 'center',
    width: responsiveDimensions.button.width,
    alignSelf: 'center',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: responsiveFontSize.md,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: responsiveFontSize.sm,
    color: '#000000',
    marginVertical: moderateVerticalScale(5),
    textAlign: 'center',
  },
  successText: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  pendingText: {
    color: '#ffc107',
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: moderateVerticalScale(15),
    paddingHorizontal: moderateScale(10),
  },
  radioButton: {
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: moderateScale(5),
    flex: 1,
    marginHorizontal: moderateScale(5),
    alignItems: 'center',
  },
  radioSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  radioText: {
    color: '#000000',
    fontSize: responsiveFontSize.sm,
  },
});

export default Dlt;
