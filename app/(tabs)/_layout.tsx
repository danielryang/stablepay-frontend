import React, { useEffect } from "react";
import { Dimensions, Pressable, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

import { Link, Tabs } from "expo-router";

import FontAwesome from "@expo/vector-icons/FontAwesome";

import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

const { width } = Dimensions.get("window");
const TAB_COUNT = 2;
const TAB_WIDTH = width / TAB_COUNT;

function TabBarIcon(props: {
    name: React.ComponentProps<typeof FontAwesome>["name"];
    color: string;
}) {
    return <FontAwesome size={28} color={props.color} name={props.name} />;
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const colorScheme = useColorScheme();
    const activeColor = Colors[colorScheme ?? "light"].tint;
    const inactiveColor = "#999";
    const indicatorPosition = useSharedValue(0);

    useEffect(() => {
        indicatorPosition.value = withTiming(state.index * TAB_WIDTH, {
            duration: 200,
            easing: Easing.out(Easing.ease),
        });
    }, [state.index]);

    const animatedIndicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: indicatorPosition.value }],
        };
    });

    return (
        <View
            style={{
                flexDirection: "row",
                backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                borderTopWidth: 1,
                borderTopColor: colorScheme === "dark" ? "#333" : "#e5e7eb",
                height: 60,
            }}
        >
            <Animated.View
                style={[
                    {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: TAB_WIDTH,
                        height: 3,
                        backgroundColor: "#3b82f6",
                        borderBottomLeftRadius: 2,
                        borderBottomRightRadius: 2,
                    },
                    animatedIndicatorStyle,
                ]}
            />
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: "tabPress",
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: "tabLongPress",
                        target: route.key,
                    });
                };

                const iconName = route.name === "index" ? "home" : "bar-chart";

                return (
                    <Pressable
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={{
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            paddingVertical: 8,
                        }}
                    >
                        <TabBarIcon
                            name={iconName as React.ComponentProps<typeof FontAwesome>["name"]}
                            color={isFocused ? activeColor : inactiveColor}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
}

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: useClientOnlyValue(false, true),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarShowLabel: false,
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="two"
                options={{
                    title: "Activity",
                    tabBarShowLabel: false,
                    headerShown: false,
                }}
            />
        </Tabs>
    );
}
