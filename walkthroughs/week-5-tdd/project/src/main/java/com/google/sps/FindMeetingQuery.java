// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.sps;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.List;
import java.util.ArrayList;

public final class FindMeetingQuery {
    public Collection<TimeRange> query(Collection<Event> events, MeetingRequest request) {
        Collection<String> attendees = request.getAttendees();
        int duration = (int) request.getDuration();

        Set<TimeRange> conflictTimes = new HashSet<TimeRange>();

        for (Event e : events) {                                        // find all unique conflicting time ranges from the events
            TimeRange when = e.getWhen();
            Set<String> eventAttendees = e.getAttendees();              // hashset of event attendees
                for (String a : attendees) {
                    if (eventAttendees.contains(a)) {                   // if the meeting attendee is part of this event
                        conflictTimes.add(when);                        // add the event time range to the list of conflicting times
                    }
                }
        }

        // System.out.println("Here are the conflict time ranges: ");
        // System.out.println(conflictTimes);

        List<TimeRange> possibleTimes = new ArrayList<TimeRange>();
        List<TimeRange> conflictTimesList = new ArrayList<TimeRange>(conflictTimes);

        Collections.sort(conflictTimesList, TimeRange.ORDER_BY_START);  // order the conflict times by start time
        int startMinute = TimeRange.START_OF_DAY;
        for (TimeRange c : conflictTimesList) {                         // find all time ranges that do not conflict
            if (startMinute < c.start()) {                              // if the next start time does not overlap past the next conflict
                TimeRange possibleTime = TimeRange.fromStartEnd(startMinute, c.start(), false);
                if (possibleTime.duration() >= duration) {              // if the possible time range has sufficient duration
                    possibleTimes.add(possibleTime);                    // add the event time range to list of possible times
                }
            }
            if (startMinute < c.end()) {
                startMinute = c.end();                                  // start the next time range at the end of the latest conflict
            }
        }

        // find the last time range after the last conflict of the day
        if (startMinute < TimeRange.END_OF_DAY) {  
            TimeRange possibleTime = TimeRange.fromStartEnd(startMinute, TimeRange.END_OF_DAY, true);
            if (possibleTime.duration() >= duration) {
                possibleTimes.add(possibleTime);
            }
        }

        // sort possible times by start time
        Collections.sort(possibleTimes, TimeRange.ORDER_BY_START);

        // System.out.println("Here are the possible time ranges: ");
        // System.out.println(possibleTimes);
        return possibleTimes;

        // throw new UnsupportedOperationException("TODO: Implement this method.");
    }
}
