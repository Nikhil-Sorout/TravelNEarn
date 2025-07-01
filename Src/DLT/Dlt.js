
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
        } else if (type === 'ind_driving_license' && result?.status === 'id_found') {
          const details = {
            dlNumber: result.input_details?.input_id_number || '',
            dob: result.input_details?.input_dob || '',
          };
          await AsyncStorage.setItem('dlStatus', 'completed');
          await AsyncStorage.setItem('dlDetails', JSON.stringify(details));
          setDetails(details);
          Alert.alert('Success', 'Driving License verification successful! The license is valid and matches the provided details.');
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
        const dlStatus = await AsyncStorage.getItem('dlStatus');
        const panStatus = await AsyncStorage.getItem('panStatus');
        const dlDetails = await AsyncStorage.getItem('dlDetails');
        const panDetails = await AsyncStorage.getItem('panDetails');

        if (dlStatus === 'completed' && dlDetails) {
          const { dlNumber, dob } = JSON.parse(dlDetails);
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
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.header}>Profile Verification (KYC)</Text>
        <Text style={styles.subtitle}>VERIFY YOUR PROFILE IN 3 EASY STEPS</Text>

        {/* Driving License Verification */}
        <Text style={styles.sectionTitle}>Driving License</Text>
        <TextInput
          style={[styles.input, isDlVerified && styles.disabledInput]}
          placeholder="Enter Driving License Number"
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
          value={panNumber}
          onChangeText={setPanNumber}
          editable={!isPanVerified}
        />
        <TextInput
          style={[styles.input, isPanVerified && styles.disabledInput]}
          placeholder="Enter Full Name as per PAN"
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  dateButton: {
    justifyContent: 'center',
  },
  dateText: {
    color: '#333',
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#e9ecef',
    opacity: 0.6,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 5,
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
    marginBottom: 15,
  },
  radioButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  radioSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  radioText: {
    color: '#333',
    fontSize: 14,
  },
});

export default Dlt;
