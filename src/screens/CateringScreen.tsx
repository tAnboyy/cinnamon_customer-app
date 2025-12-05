import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Linking } from 'react-native';
// import { getMenuItems } from '../services/api';
import { menuItems as dummyMenuItems } from '../data/dummyData';
import ItemCard from '../components/ItemCard';
import { MenuItem } from '../types';

const CateringScreen = () => {
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Use same menu items for Catering view (no add to cart)
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
    
      const sections = Object.keys(groupedItems).sort().map(category => ({
        title: category,
        data: groupedItems[category],
      }));

    if (loading) {
        return <ActivityIndicator size="large" style={styles.container} />;
    }
  
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Catering</Text>
        </View>
        <TouchableOpacity
          style={[styles.callContainer, { marginHorizontal: 16, marginTop: 8 }]}
          onPress={() => Linking.openURL('tel:9842429243')}
          activeOpacity={0.8}
        >
          <Text style={styles.callIcon}>📞</Text>
          <Text style={styles.callText}>Call to place Catering orders</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchBar}
          placeholder="Search catering..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
        <SectionList
          sections={sections}
          renderItem={({ item }) => <ItemCard item={item} hideAdd hideQuantityBadge hidePrice />}
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
      headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
      },
      headerTitle: {
        textAlign: 'center',
        width: '100%',
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
      },
      callContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#60df39ff',
        borderRadius: 20,
      },
      callText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '600',
      },
      callIcon: {
        fontSize: 16,
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

export default CateringScreen;
