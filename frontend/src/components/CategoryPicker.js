import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { CATEGORIES } from '../constants/categories';

const CategoryPicker = ({ selected, onSelect }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Category</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollView}
            >
                {CATEGORIES.map((category) => (
                    <TouchableOpacity
                        key={category.id}
                        style={[
                            styles.categoryItem,
                            selected === category.id && {
                                backgroundColor: category.color,
                                borderColor: category.color
                            }
                        ]}
                        onPress={() => onSelect(category.id)}
                    >
                        <Text style={styles.categoryIcon}>{category.icon}</Text>
                        <Text style={[
                            styles.categoryLabel,
                            selected === category.id && styles.selectedLabel
                        ]}>
                            {category.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 8,
    },
    scrollView: {
        flexDirection: 'row',
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 10,
        backgroundColor: '#fff',
    },
    categoryIcon: {
        fontSize: 18,
        marginRight: 6,
    },
    categoryLabel: {
        fontSize: 14,
        color: '#333',
    },
    selectedLabel: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default CategoryPicker;
