/**
 * Simple Markdown Renderer for React Native
 * Converts markdown text to React Native components
 */

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface MarkdownTextProps {
    children: string;
    style?: any;
}

export function MarkdownText({ children, style }: MarkdownTextProps) {
    if (!children) return null;

    const lines = children.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let inList = false;

    const parseInlineMarkdown = (text: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        let key = 0;

        // Process text character by character to handle nested formatting
        const processText = (str: string, parentStyle: any = style): React.ReactNode[] => {
            const result: React.ReactNode[] = [];
            let i = 0;
            let currentText = '';
            let currentKey = key;

            while (i < str.length) {
                // Check for **bold**
                if (str.substring(i, i + 2) === '**') {
                    if (currentText) {
                        result.push(<Text key={`text-${currentKey++}`} style={parentStyle}>{currentText}</Text>);
                        currentText = '';
                    }
                    const endBold = str.indexOf('**', i + 2);
                    if (endBold !== -1) {
                        const boldText = str.substring(i + 2, endBold);
                        result.push(
                            <Text key={`bold-${currentKey++}`} style={[parentStyle, styles.bold]}>
                                {boldText}
                            </Text>
                        );
                        i = endBold + 2;
                    } else {
                        currentText += str[i];
                        i++;
                    }
                }
                // Check for `code`
                else if (str[i] === '`') {
                    if (currentText) {
                        result.push(<Text key={`text-${currentKey++}`} style={parentStyle}>{currentText}</Text>);
                        currentText = '';
                    }
                    const endCode = str.indexOf('`', i + 1);
                    if (endCode !== -1) {
                        const codeText = str.substring(i + 1, endCode);
                        result.push(
                            <Text key={`code-${currentKey++}`} style={[parentStyle, styles.code]}>
                                {codeText}
                            </Text>
                        );
                        i = endCode + 1;
                    } else {
                        currentText += str[i];
                        i++;
                    }
                }
                // Regular character
                else {
                    currentText += str[i];
                    i++;
                }
            }

            if (currentText) {
                result.push(<Text key={`text-${currentKey++}`} style={parentStyle}>{currentText}</Text>);
            }

            key = currentKey;
            return result.length > 0 ? result : [<Text key={`default-${key++}`} style={parentStyle}>{str}</Text>];
        };

        return processText(text);
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Handle headers
        if (trimmedLine.startsWith('# ')) {
            if (inList) {
                elements.push(
                    <View key={`list-${index}`} style={styles.listContainer}>
                        {listItems.map((item, i) => (
                            <Text key={i} style={[style, styles.listItem]}>• {item.replace(/^-\s*/, '')}</Text>
                        ))}
                    </View>
                );
                listItems = [];
                inList = false;
            }
            elements.push(
                <Text key={`h1-${index}`} style={[style, styles.h1]}>
                    {parseInlineMarkdown(trimmedLine.substring(2))}
                </Text>
            );
        } else if (trimmedLine.startsWith('## ')) {
            if (inList) {
                elements.push(
                    <View key={`list-${index}`} style={styles.listContainer}>
                        {listItems.map((item, i) => (
                            <Text key={i} style={[style, styles.listItem]}>• {item.replace(/^-\s*/, '')}</Text>
                        ))}
                    </View>
                );
                listItems = [];
                inList = false;
            }
            elements.push(
                <Text key={`h2-${index}`} style={[style, styles.h2]}>
                    {parseInlineMarkdown(trimmedLine.substring(3))}
                </Text>
            );
        } else if (trimmedLine.startsWith('### ')) {
            if (inList) {
                elements.push(
                    <View key={`list-${index}`} style={styles.listContainer}>
                        {listItems.map((item, i) => (
                            <Text key={i} style={[style, styles.listItem]}>• {item.replace(/^-\s*/, '')}</Text>
                        ))}
                    </View>
                );
                listItems = [];
                inList = false;
            }
            elements.push(
                <Text key={`h3-${index}`} style={[style, styles.h3]}>
                    {parseInlineMarkdown(trimmedLine.substring(4))}
                </Text>
            );
        }
        // Handle list items
        else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            if (!inList) {
                inList = true;
            }
            listItems.push(trimmedLine);
        }
        // Handle empty lines
        else if (trimmedLine === '') {
            if (inList && listItems.length > 0) {
                elements.push(
                    <View key={`list-${index}`} style={styles.listContainer}>
                        {listItems.map((item, i) => (
                            <Text key={i} style={[style, styles.listItem]}>
                                • {parseInlineMarkdown(item.replace(/^[-*]\s*/, ''))}
                            </Text>
                        ))}
                    </View>
                );
                listItems = [];
                inList = false;
            }
            elements.push(<View key={`spacer-${index}`} style={styles.spacer} />);
        }
        // Handle regular text
        else {
            if (inList) {
                elements.push(
                    <View key={`list-${index}`} style={styles.listContainer}>
                        {listItems.map((item, i) => (
                            <Text key={i} style={[style, styles.listItem]}>
                                • {parseInlineMarkdown(item.replace(/^[-*]\s*/, ''))}
                            </Text>
                        ))}
                    </View>
                );
                listItems = [];
                inList = false;
            }
            elements.push(
                <Text key={`text-${index}`} style={style}>
                    {parseInlineMarkdown(trimmedLine)}
                </Text>
            );
        }
    });

    // Handle remaining list items
    if (inList && listItems.length > 0) {
        elements.push(
            <View key="list-final" style={styles.listContainer}>
                {listItems.map((item, i) => (
                    <Text key={i} style={[style, styles.listItem]}>
                        • {parseInlineMarkdown(item.replace(/^[-*]\s*/, ''))}
                    </Text>
                ))}
            </View>
        );
    }

    return <View>{elements}</View>;
}

const styles = StyleSheet.create({
    h1: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        color: '#29343D',
    },
    h2: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 6,
        color: '#29343D',
    },
    h3: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 4,
        color: '#29343D',
    },
    bold: {
        fontWeight: 'bold',
    },
    italic: {
        fontStyle: 'italic',
    },
    code: {
        fontFamily: 'monospace',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    listContainer: {
        marginVertical: 8,
        paddingLeft: 8,
    },
    listItem: {
        marginBottom: 6,
        lineHeight: 22,
    },
    spacer: {
        height: 8,
    },
});

