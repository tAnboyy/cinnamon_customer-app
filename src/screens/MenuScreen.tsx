import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
// import { getMenuItems } from '../services/api';
import { menuItems as dummyMenuItems } from '../data/dummyData';
import ItemCard from '../components/ItemCard';
import { MenuItem } from '../types';

const MenuScreen = () => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Using dummy data locally
    setItems(dummyMenuItems);
    setLoading(false);
  }, []);

  const filteredItems = items.filter(
    item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
  );

  const groupedItems = filteredItems.reduce((acc, item) => {
    const { category } = item;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const sections = Object.keys(groupedItems).map(category => ({
    title: category,
    data: groupedItems[category],
  }));

  if (loading) {
    return <ActivityIndicator size="large" style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Menu</Text>
      <TextInput
        style={styles.searchBar}
        placeholder="Search menu..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
      />
      <SectionList
        sections={sections}
        renderItem={({ item }) => <ItemCard item={item} />}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 160 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    screenTitle: {
      textAlign: 'center',
      fontSize: 22,
      fontWeight: '700',
      color: '#000',
      marginTop: 12,
    },
    searchBar: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 8,
      margin: 16,
      paddingLeft: 8,
      color: '#000',
    },
    sectionHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        backgroundColor: '#f2f2f2',
        paddingVertical: 8,
        paddingHorizontal: 16,
      color: '#000',
    }
  });

export default MenuScreen;
