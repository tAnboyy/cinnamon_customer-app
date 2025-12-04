import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { getMenuItems } from '../services/api';
import ItemCard from '../components/ItemCard';
import { MenuItem } from '../types';

const MenuScreen = () => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMenuItems()
      .then(response => {
        setItems(response.data);
      })
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
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
      <TextInput
        style={styles.searchBar}
        placeholder="Search menu..."
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    searchBar: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 8,
      margin: 16,
      paddingLeft: 8,
    },
    sectionHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        backgroundColor: '#f2f2f2',
        paddingVertical: 8,
        paddingHorizontal: 16,
    }
  });

export default MenuScreen;
