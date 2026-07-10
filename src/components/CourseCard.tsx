import { View, Text, Image } from '@tarojs/components';
import { Course } from '../types';

export default function CourseCard({ course, onPress }: { course: Course; onPress?: (course: Course) => void }) {
  return (
    <View className="course-card" onClick={() => onPress?.(course)}>
      <View className="course-cover-wrap">
        <Image className="course-cover" src={course.coverImage} mode="aspectFill" />
        {course.label ? <Text className="course-label gradient">{course.label}</Text> : null}
        <Text className="course-duration">{course.duration}</Text>
      </View>
      <Text className="course-title">{course.title}</Text>
    </View>
  );
}
