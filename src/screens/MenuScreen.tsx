import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SectionList, TextInput, StyleSheet, ActivityIndicator, Alert, RefreshControl, Platform, Animated } from 'react-native';
import { getMenuItems } from '../services/api';
// import { menuItems as dummyMenuItems } from '../data/dummyData';
import ItemCard from '../components/ItemCard';
import { MenuItem } from '../types';

const MenuScreen = () => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollY = useRef(0);
  const headerHeight = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[MenuScreen] Fetching menu items from backend...');
      const response = await getMenuItems();
      console.log('[MenuScreen] Received menu items:', response.data?.length || 0, 'items');
      
      if (response.data && Array.isArray(response.data)) {
        setItems(response.data as MenuItem[]);
      } else {
        console.warn('[MenuScreen] Invalid response format:', response.data);
        setError('Invalid menu data received');
      }
    } catch (err) {
      console.error('[MenuScreen] Failed to load menu items:', err);
      setError('Failed to load menu items. Please try again.');
      Alert.alert(
        'Error Loading Menu',
        'Unable to fetch menu items from server. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: loadMenuItems },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      console.log('[MenuScreen] Refreshing menu items...');
      const response = await getMenuItems();
      
      if (response.data && Array.isArray(response.data)) {
        setItems(response.data as MenuItem[]);
        console.log('[MenuScreen] Menu refreshed successfully');
      } else {
        setError('Invalid menu data received');
      }
    } catch (err) {
      console.error('[MenuScreen] Failed to refresh menu:', err);
      setError('Failed to refresh menu');
    } finally {
      setRefreshing(false);
    }
  };

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

  // Convert to sections with pairs for two-column layout
  const sections = Object.keys(groupedItems).map(category => {
    const items = groupedItems[category];
    const pairs: MenuItem[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      pairs.push([items[i], items[i + 1]].filter(Boolean));
    }
    return {
      title: category,
      data: pairs,
    };
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <Text style={styles.retryText} onPress={loadMenuItems}>
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <Animated.View style={{
            opacity: Platform.OS === 'web' ? headerHeight : 1,
            maxHeight: Platform.OS === 'web' ? headerHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200]
            }) : undefined,
            overflow: 'hidden'
          }}>
            <Text style={styles.screenTitle}>Menu</Text>
            <TextInput
              style={styles.searchBar}
              placeholder="Search dishes..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
          </Animated.View>
        </View>
        <SectionList
        sections={sections}
        stickySectionHeadersEnabled={true}
        onScroll={Platform.OS === 'web' ? (event) => {
          const currentScrollY = event.nativeEvent.contentOffset.y;
          const diff = currentScrollY - scrollY.current;
          
          if (diff > 5 && currentScrollY > 50) {
            // Scrolling down
            Animated.timing(headerHeight, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false
            }).start();
          } else if (diff < -5) {
            // Scrolling up
            Animated.timing(headerHeight, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false
            }).start();
          }
          
          scrollY.current = currentScrollY;
        } : undefined}
        scrollEventThrottle={16}
        renderItem={({ item: pair }) => (
          <View style={styles.gridContainer}>
            {pair.map((item, index) => (
              <View key={item.id} style={styles.gridItem}>
                <ItemCard item={item} compact />
              </View>
            ))}
            {/* Add empty placeholder if only one item in the pair */}
            {pair.length === 1 && <View style={styles.gridItem} />}
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeader}>{title}</Text>
          </View>
        )}
        keyExtractor={(item, index) => `pair-${index}`}
        contentContainerStyle={{ paddingBottom: 160 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1a1a1a']}
            tintColor="#1a1a1a"
          />
        }
        ListEmptyComponent={
          <View style={styles.centerContent}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>No menu items available</Text>
            <Text style={styles.retryText} onPress={loadMenuItems}>
              Tap to reload
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
      ...(Platform.OS === 'web' && {
        minHeight: '100vh',
      }),
    },
    contentWrapper: {
      flex: 1,
      maxWidth: Platform.OS === 'web' ? 1200 : undefined,
      width: '100%',
      alignSelf: 'center',
      backgroundColor: '#fff',
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      minHeight: 200,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: '#666',
    },
    errorText: {
      fontSize: 18,
      color: '#d32f2f',
      textAlign: 'center',
      marginBottom: 12,
    },
    retryText: {
      fontSize: 16,
      color: '#1a1a1a',
      fontWeight: '600',
      textDecorationLine: 'underline',
      marginTop: 8,
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
      }),
    },
    emptyText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    header: {
      backgroundColor: '#fff',
      paddingHorizontal: Platform.OS === 'web' ? 24 : 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    screenTitle: {
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '700',
      color: '#1a1a1a',
      marginTop: 16,
      marginBottom: 12,
    },
    searchBar: {
      height: 48,
      borderColor: '#e0e0e0',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      color: '#1a1a1a',
      fontSize: 16,
      backgroundColor: '#fafafa',
      ...(Platform.OS === 'web' && {
        outlineStyle: 'none',
      }),
    },
    sectionHeaderContainer: {
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    sectionHeader: {
      fontSize: 18,
      fontWeight: '700',
      backgroundColor: '#f8f8f8',
      paddingVertical: 12,
      paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
      color: '#1a1a1a',
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
      textAlign: Platform.OS === 'web' ? 'center' : 'left',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: Platform.OS === 'web' ? 16 : 8,
      paddingVertical: 8,
      maxWidth: Platform.OS === 'web' ? 800 : undefined,
      alignSelf: Platform.OS === 'web' ? 'center' : undefined,
      width: '100%',
    },
    gridItem: {
      width: '50%',
      paddingHorizontal: 8,
      marginBottom: 8,
    },
  });

export default MenuScreen;
