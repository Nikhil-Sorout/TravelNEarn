import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Header from '../../header';
const { width, height } = Dimensions.get('window'); // Get screen dimensions

const faqData = [
  {
    question: "Lorem ipsum dolor sit amet consectetur?",
    answer: "Lorem ipsum dolor sit amet consectetur. Posuere sed odio elementum nunc volutpat egestas nunc ridiculus leo. Proin cras aenean eget sapien. Sollicitudin luctus vestibulum elit proin sit massa. Morbi duis eu amet nisi pulvinar mollis nulla sapien. Massa proin eros placerat posuere vestibulum ut magna hendrerit. Sem egestas nunc volutpat dictumst faucibus. Ultricies tristique netus vitae sagittis nulla velit integer.",
  },
  { question: "Lorem ipsum dolor sit amet consectetur?", answer: "Answer for the second FAQ goes here." },
  { question: "Lorem ipsum dolor sit amet consectetur?", answer: "Answer for the third FAQ goes here." },
];

const Faq = ({navigation}) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="FAQ's" navigation={navigation} />


      <ScrollView contentContainerStyle={styles.contentContainer}>
        {faqData.map((item, index) => (
          <View key={index} style={styles.faqItem}>
            <TouchableOpacity onPress={() => toggleExpand(index)} style={styles.questionContainer}>
              <Text style={styles.questionText}>{item.question}</Text>
              <Ionicons
                name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                size={24}
                color="black"
              />
            </TouchableOpacity>
            {expandedIndex === index && <Text style={styles.answerText}>{item.answer}</Text>}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default Faq;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    marginTop:20
  },
  header: {
    backgroundColor: '#D83f3f',
    paddingVertical: height * 0.02, // Adjust padding for better touch targets on smaller screens
    paddingHorizontal: width * 0.05, // Relative horizontal padding
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 33,
  },
  headerTitle: {
    color: 'white',
    fontSize: width * 0.05, // Scaled font size for better readability
    fontWeight: 'bold',
    marginLeft: 10,
  },
  contentContainer: {
    padding: width * 0.04, // Dynamic padding for better readability on small screens
  },
  faqItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    padding: width * 0.04, // Dynamic padding inside each FAQ item
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    fontSize: width * 0.04, // Slightly larger text for questions for better legibility
    fontWeight: '500',
    color: 'black',
  },
  answerText: {
    fontSize: width * 0.04, // Slightly smaller text for answers, keeping readability
    color: '#555',
    marginTop: 8,
    lineHeight: 20,
  },
});
