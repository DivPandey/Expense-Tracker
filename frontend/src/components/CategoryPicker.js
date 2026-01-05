import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CATEGORIES } from '../constants/categories';
import { useTheme } from '../context/ThemeContext';

const CategoryPicker = ({ selected, onSelect }) => {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Category</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollView}
            >
                {CATEGORIES.map((category) => {
                    const isSelected = selected === category.id;
                    return (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.categoryItem,
                                isSelected && {
                                    backgroundColor: category.color,
                                    borderColor: category.color
                                }
                            ]}
                            onPress={() => onSelect(category.id)}
                        >
                            <MaterialIcons
                                name={category.icon}
                                size={18}
                                color={isSelected ? '#fff' : category.color}
                                style={styles.categoryIcon}
                            />
                            <Text style={[
                                styles.categoryLabel,
                                isSelected && styles.selectedLabel
                            ]}>
                                {category.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};


const createStyles = (colors) => StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
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
        borderColor: colors.border,
        marginRight: 10,
        backgroundColor: colors.surface,
    },
    categoryIcon: {
        fontSize: 18,
        marginRight: 6,
    },
    categoryLabel: {
        fontSize: 14,
        color: colors.text,
    },
    selectedLabel: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default CategoryPicker;

